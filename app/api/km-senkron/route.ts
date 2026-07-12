import { NextResponse } from "next/server";
import { kilometreleriSenkronizeEt } from "@/app/actions/km-senkron-actions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function yetkiliMi(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") ?? "";
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;

  // Vercel Cron istekleri
  if (request.headers.get("x-vercel-cron") === "1") return true;

  return false;
}

export async function GET(request: Request) {
  if (!yetkiliMi(request) && process.env.NODE_ENV === "production") {
    // Yerelde kolay test; production'da cron/secret ister
    const url = new URL(request.url);
    if (url.searchParams.get("key") !== process.env.KM_SENKRON_SIFRE) {
      return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
    }
  }

  const sonuc = await kilometreleriSenkronizeEt({ zorla: true, minAralikMs: 0 });
  return NextResponse.json(sonuc, { status: sonuc.ok ? 200 : 500 });
}

export async function POST(request: Request) {
  return GET(request);
}
