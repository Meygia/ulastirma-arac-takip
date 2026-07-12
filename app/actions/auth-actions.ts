"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  kullaniciDogrula,
  oturumCereziAyarlari,
  oturumCereziSilAyarlari,
  oturumTokeniOlustur,
  oturumTokeniniCoz,
  OTURUM_CEREZI,
} from "@/app/lib/auth";

export type GirisSonucu = {
  ok: boolean;
  hata?: string;
};

export async function girisYap(
  _onceki: GirisSonucu | null,
  formData: FormData,
): Promise<GirisSonucu> {
  const kullanici = String(formData.get("kullanici") ?? "").trim();
  const sifre = String(formData.get("sifre") ?? "");

  if (!kullanici || !sifre) {
    return { ok: false, hata: "Kullanıcı adı ve şifre gerekli." };
  }

  if (!process.env.AUTH_SECRET?.trim() || !process.env.AUTH_USERS?.trim()) {
    return {
      ok: false,
      hata: "Giriş sistemi henüz yapılandırılmamış (AUTH_SECRET / AUTH_USERS).",
    };
  }

  if (!kullaniciDogrula(kullanici, sifre)) {
    return { ok: false, hata: "Kullanıcı adı veya şifre hatalı." };
  }

  const token = await oturumTokeniOlustur(kullanici);
  const jar = await cookies();
  jar.set(oturumCereziAyarlari(token));

  redirect("/");
}

export async function cikisYap() {
  const jar = await cookies();
  jar.set(oturumCereziSilAyarlari());
  redirect("/giris");
}

export async function mevcutKullanici() {
  const jar = await cookies();
  const oturum = await oturumTokeniniCoz(jar.get(OTURUM_CEREZI)?.value);
  return oturum?.kullanici ?? null;
}
