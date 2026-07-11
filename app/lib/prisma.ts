import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaLibSql as PrismaLibSqlNode } from "@prisma/adapter-libsql";
import { PrismaLibSql as PrismaLibSqlWeb } from "@prisma/adapter-libsql/web";

const PRISMA_SCHEMA_VERSION = 9;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaVersion?: number;
};

function normalizeEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

function isRemoteDatabase(url: string) {
  return (
    url.startsWith("libsql://") ||
    url.startsWith("https://") ||
    url.includes("turso.io")
  );
}

function createPrismaClient() {
  const url = normalizeEnv(process.env.DATABASE_URL) || "file:./dev.db";
  const authToken = normalizeEnv(process.env.TURSO_AUTH_TOKEN) || undefined;
  const remote = isRemoteDatabase(url);

  const Adapter = remote ? PrismaLibSqlWeb : PrismaLibSqlNode;
  const adapter = new Adapter({
    url,
    authToken,
  });

  return new PrismaClient({ adapter });
}

function prismaGuncelMi(client: PrismaClient) {
  const aracAlani = Prisma.AracScalarFieldEnum;
  const gecmisAlani = Prisma.AracBilgiGecmisiScalarFieldEnum;

  return (
    typeof client.arac?.findMany === "function" &&
    typeof client.aracBilgiGecmisi?.findMany === "function" &&
    typeof client.aracFirma?.findMany === "function" &&
    typeof client.aracBelgesi?.findMany === "function" &&
    "lastikTuru" in aracAlani &&
    "lastikTarihi" in aracAlani &&
    "lastikDegisimYeri" in aracAlani &&
    "lastikMuhafazaYeri" in aracAlani &&
    "atananKisiTelefon" in aracAlani &&
    "lastikTuru" in gecmisAlani &&
    "AracBelgesi" in Prisma.ModelName &&
    "AracFirma" in Prisma.ModelName
  );
}

export function getPrisma(): PrismaClient {
  const cached = globalForPrisma.prisma;
  const surumUyumlu =
    globalForPrisma.prismaSchemaVersion === PRISMA_SCHEMA_VERSION;

  if (cached && surumUyumlu && prismaGuncelMi(cached)) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => undefined);
  }

  const client = createPrismaClient();

  if (!prismaGuncelMi(client)) {
    throw new Error(
      "Prisma istemcisi güncel değil. Lütfen geliştirme sunucusunu durdurup `npx prisma generate` çalıştırın ve `npm run dev` ile yeniden başlatın.",
    );
  }

  globalForPrisma.prisma = client;
  globalForPrisma.prismaSchemaVersion = PRISMA_SCHEMA_VERSION;
  return client;
}
