"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile, access } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import {
  belgeTuruGecerliMi,
  IZIN_VERILEN_BELGE_MIME_TURLERI,
  MAKSIMUM_BELGE_BOYUTU,
  type AracBelgesiKaydi,
} from "@/app/lib/arac-belgeleri";
import { getPrisma } from "@/app/lib/prisma";

function belgeyiDonustur(belge: {
  id: number;
  aracId: number;
  tur: string;
  baslik: string | null;
  aciklama: string | null;
  dosyaAdi: string;
  dosyaYolu: string;
  mimeType: string;
  boyut: number;
  yuklenmeTarihi: Date;
}): AracBelgesiKaydi {
  if (!belgeTuruGecerliMi(belge.tur)) {
    throw new Error("Geçersiz belge türü.");
  }

  return {
    id: belge.id,
    aracId: belge.aracId,
    tur: belge.tur,
    baslik: belge.baslik,
    aciklama: belge.aciklama,
    dosyaAdi: belge.dosyaAdi,
    dosyaYolu: belge.dosyaYolu,
    mimeType: belge.mimeType,
    boyut: belge.boyut,
    yuklenmeTarihi: belge.yuklenmeTarihi.toISOString(),
  };
}

function dosyaAdiniGuvenliYap(dosyaAdi: string) {
  const temiz = dosyaAdi
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return temiz.slice(0, 120) || "belge";
}

function mimeTypeGecerliMi(mimeType: string) {
  return IZIN_VERILEN_BELGE_MIME_TURLERI.includes(
    mimeType as (typeof IZIN_VERILEN_BELGE_MIME_TURLERI)[number],
  );
}

async function aracVarMi(aracId: number) {
  const arac = await getPrisma().arac.findUnique({
    where: { id: aracId },
    select: { id: true },
  });

  if (!arac) {
    throw new Error("Araç bulunamadı.");
  }
}

function belgeDosyaYoluOlustur(aracId: number, dosyaAdi: string) {
  const guvenliAd = dosyaAdiniGuvenliYap(dosyaAdi);
  const benzersizAd = `${randomUUID()}-${guvenliAd}`;
  const goreceliYol = path.posix.join(
    "uploads",
    "araclar",
    String(aracId),
    benzersizAd,
  );

  return {
    goreceliYol: `/${goreceliYol.replace(/\\/g, "/")}`,
    tamYol: path.join(process.cwd(), "public", ...goreceliYol.split("/")),
  };
}

export async function belgeleriGetir(
  aracId: number,
): Promise<AracBelgesiKaydi[]> {
  const kayitlar = await getPrisma().aracBelgesi.findMany({
    where: { aracId },
    orderBy: [{ yuklenmeTarihi: "desc" }],
  });

  return kayitlar.map(belgeyiDonustur);
}

export async function belgeYukle(aracId: number, formData: FormData) {
  await aracVarMi(aracId);

  const tur = formData.get("tur");
  const baslik = String(formData.get("baslik") ?? "").trim() || null;
  const aciklama = String(formData.get("aciklama") ?? "").trim() || null;
  const dosya = formData.get("dosya");

  if (typeof tur !== "string" || !belgeTuruGecerliMi(tur)) {
    throw new Error("Geçerli bir belge türü seçin.");
  }

  if (!(dosya instanceof File) || dosya.size === 0) {
    throw new Error("Yüklenecek dosya seçin.");
  }

  if (dosya.size > MAKSIMUM_BELGE_BOYUTU) {
    throw new Error("Dosya boyutu en fazla 15 MB olabilir.");
  }

  const mimeType = dosya.type || "application/octet-stream";
  if (!mimeTypeGecerliMi(mimeType)) {
    throw new Error(
      "Desteklenmeyen dosya türü. PDF, JPEG, PNG, WEBP veya Word dosyası yükleyin.",
    );
  }

  const { goreceliYol, tamYol } = belgeDosyaYoluOlustur(aracId, dosya.name);

  await mkdir(path.dirname(tamYol), { recursive: true });
  await writeFile(tamYol, Buffer.from(await dosya.arrayBuffer()));

  try {
    const kayit = await getPrisma().aracBelgesi.create({
      data: {
        aracId,
        tur,
        baslik,
        aciklama,
        dosyaAdi: dosya.name,
        dosyaYolu: goreceliYol,
        mimeType,
        boyut: dosya.size,
      },
    });

    revalidatePath("/");

    return belgeyiDonustur(kayit);
  } catch (error) {
    await unlink(tamYol).catch(() => undefined);
    throw error;
  }
}

export async function belgeSil(aracId: number, belgeId: number) {
  const belge = await getPrisma().aracBelgesi.findFirst({
    where: { id: belgeId, aracId },
  });

  if (!belge) {
    throw new Error("Belge bulunamadı.");
  }

  await getPrisma().aracBelgesi.delete({
    where: { id: belgeId },
  });

  revalidatePath("/");

  return belgeyiDonustur(belge);
}

export async function belgeGeriYukle(kayit: AracBelgesiKaydi) {
  const tamYol = path.join(process.cwd(), "public", kayit.dosyaYolu.slice(1));

  try {
    await access(tamYol);
  } catch {
    throw new Error("Belge dosyası bulunamadı, geri alınamadı.");
  }

  const olusturulan = await getPrisma().aracBelgesi.create({
    data: {
      aracId: kayit.aracId,
      tur: kayit.tur,
      baslik: kayit.baslik,
      aciklama: kayit.aciklama,
      dosyaAdi: kayit.dosyaAdi,
      dosyaYolu: kayit.dosyaYolu,
      mimeType: kayit.mimeType,
      boyut: kayit.boyut,
      yuklenmeTarihi: new Date(kayit.yuklenmeTarihi),
    },
  });

  revalidatePath("/");

  return belgeyiDonustur(olusturulan);
}

export async function belgeDosyasiniTemizle(dosyaYolu: string) {
  const halaKayitli = await getPrisma().aracBelgesi.findFirst({
    where: { dosyaYolu },
    select: { id: true },
  });

  if (halaKayitli) return;

  const tamYol = path.join(process.cwd(), "public", dosyaYolu.slice(1));
  await unlink(tamYol).catch(() => undefined);
}

export async function belgeGuncelle(
  aracId: number,
  belgeId: number,
  veri: { tur: string; baslik: string; aciklama: string },
) {
  if (!belgeTuruGecerliMi(veri.tur)) {
    throw new Error("Geçerli bir belge türü seçin.");
  }

  const kayit = await getPrisma().aracBelgesi.update({
    where: { id: belgeId, aracId },
    data: {
      tur: veri.tur,
      baslik: veri.baslik.trim() || null,
      aciklama: veri.aciklama.trim() || null,
    },
  });

  revalidatePath("/");

  return belgeyiDonustur(kayit);
}
