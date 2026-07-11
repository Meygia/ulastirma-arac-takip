import { NextResponse } from "next/server";
import { getPrisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  const hasUrl = databaseUrl.length > 0;
  const hasToken = (process.env.TURSO_AUTH_TOKEN?.trim() ?? "").length > 0;
  const remote = databaseUrl.startsWith("libsql://") || databaseUrl.includes("turso.io");

  try {
    const aracCount = await getPrisma().arac.count();

    return NextResponse.json({
      ok: true,
      aracCount,
      remote,
      hasUrl,
      hasToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";

    return NextResponse.json(
      {
        ok: false,
        remote,
        hasUrl,
        hasToken,
        error: message,
      },
      { status: 500 },
    );
  }
}
