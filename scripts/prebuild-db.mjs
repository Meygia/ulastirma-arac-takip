import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const databaseUrl = process.env.DATABASE_URL ?? "";

async function applyTursoMigrations() {
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!authToken) {
    console.error("TURSO_AUTH_TOKEN is required for Turso migrations.");
    process.exit(1);
  }

  const client = createClient({ url: databaseUrl, authToken });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);

  const migrationsDir = join(process.cwd(), "prisma/migrations");
  const migrationDirs = (await readdir(migrationsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migrationName of migrationDirs) {
    const sqlPath = join(migrationsDir, migrationName, "migration.sql");
    let sql;

    try {
      sql = await readFile(sqlPath, "utf8");
    } catch {
      continue;
    }

    const existing = await client.execute({
      sql: `SELECT "migration_name" FROM "_prisma_migrations" WHERE "migration_name" = ?`,
      args: [migrationName],
    });

    if (existing.rows.length > 0) {
      console.log(`Skipping ${migrationName} (already applied)`);
      continue;
    }

    const checksum = createHash("sha256").update(sql).digest("hex");
    console.log(`Applying ${migrationName}...`);

    await client.executeMultiple(sql);

    await client.execute({
      sql: `
        INSERT INTO "_prisma_migrations" (
          "id", "checksum", "finished_at", "migration_name", "applied_steps_count", "started_at"
        ) VALUES (?, ?, datetime('now'), ?, 1, datetime('now'))
      `,
      args: [randomUUID(), checksum, migrationName],
    });
  }

  console.log("Turso migrations complete.");
}

if (databaseUrl.startsWith("libsql://")) {
  await applyTursoMigrations();
} else {
  console.log("Local SQLite detected, running prisma migrate deploy...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}
