import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OTURUM_CEREZI, oturumTokeniniCoz } from "@/app/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/giris") ||
    pathname.startsWith("/api/saglik") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(OTURUM_CEREZI)?.value;
  const oturum = await oturumTokeniniCoz(token);

  if (!oturum) {
    const girisUrl = request.nextUrl.clone();
    girisUrl.pathname = "/giris";
    girisUrl.searchParams.set("sonraki", pathname);
    return NextResponse.redirect(girisUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
