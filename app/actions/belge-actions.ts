"use server";

import { revalidatePath } from "next/cache";
import {
  belgeTuruGecerliMi,
  IZIN_VERILEN_BELGE_MIME_TURLERI,
  MAKSIMUM_BELGE_BOYUTU,
  type AracBelgesiKaydi,
} from "@/app/lib/arac-belgeleri";
import {
  belgeDosyasiVarMi,
  belgeDosyasiniKaydet,
  belgeDosyasiniSil,
} from "@/app/lib/belge-depolama";
import { getPrisma } from "@/app/lib/prisma";

export type BelgeIslemSonucu =
  | { ok: true; kayit: AracBelgesiKaydi; mesaj?: string }
  | { ok: false; mesaj: string };

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

export async function belgeleriGetir(
  aracId: number,
): Promise<AracBelgesiKaydi[]> {
  const kayitlar = await getPrisma().aracBelgesi.findMany({
    where: { aracId },
    orderBy: [{ yuklenmeTarihi: "desc" }],
  });

  return kayitlar.map(belgeyiDonustur);
}

export async function belgeYukle(
  aracId: number,
  formData: FormData,
): Promise<BelgeIslemSonucu> {
  try {
    await aracVarMi(aracId);

    const tur = formData.get("tur");
    const baslik = String(formData.get("baslik") ?? "").trim() || null;
    const aciklama = String(formData.get("aciklama") ?? "").trim() || null;
    const dosya = formData.get("dosya");

    if (typeof tur !== "string" || !belgeTuruGecerliMi(tur)) {
      return { ok: false, mesaj: "Geçerli bir belge türü seçin." };
    }

    if (!(dosya instanceof File) || dosya.size === 0) {
      return { ok: false, mesaj: "Yüklenecek dosya seçin." };
    }

    if (dosya.size > MAKSIMUM_BELGE_BOYUTU) {
      return { ok: false, mesaj: "Dosya boyutu en fazla 15 MB olabilir." };
    }

    const mimeType = dosya.type || "application/octet-stream";
    if (!mimeTypeGecerliMi(mimeType)) {
      return {
        ok: false,
        mesaj:
          "Desteklenmeyen dosya türü. PDF, JPEG, PNG, WEBP veya Word dosyası yükleyin.",
      };
    }

    const dosyaYolu = await belgeDosyasiniKaydet(aracId, dosya);

    try {
      const kayit = await getPrisma().aracBelgesi.create({
        data: {
          aracId,
          tur,
          baslik,
          aciklama,
          dosyaAdi: dosya.name,
          dosyaYolu,
          mimeType,
          boyut: dosya.size,
        },
      });

      revalidatePath("/");

      return { ok: true, kayit: belgeyiDonustur(kayit), mesaj: "Belge yüklendi." };
    } catch (error) {
      await belgeDosyasiniSil(dosyaYolu);
      throw error;
    }
  } catch (error) {
    const mesaj =
      error instanceof Error
        ? error.message
        : "Belge yüklenirken bir hata oluştu.";
    return { ok: false, mesaj };
  }
}

export async function belgeSil(
  aracId: number,
  belgeId: number,
): Promise<BelgeIslemSonucu> {
  try {
    const belge = await getPrisma().aracBelgesi.findFirst({
      where: { id: belgeId, aracId },
    });

    if (!belge) {
      return { ok: false, mesaj: "Belge bulunamadı." };
    }

    await getPrisma().aracBelgesi.delete({
      where: { id: belgeId },
    });

    revalidatePath("/");

    return { ok: true, kayit: belgeyiDonustur(belge) };
  } catch (error) {
    return {
      ok: false,
      mesaj:
        error instanceof Error ? error.message : "Belge silinemedi.",
    };
  }
}

export async function belgeGeriYukle(
  kayit: AracBelgesiKaydi,
): Promise<BelgeIslemSonucu> {
  try {
    const dosyaVar = await belgeDosyasiVarMi(kayit.dosyaYolu);
    if (!dosyaVar) {
      return {
        ok: false,
        mesaj: "Belge dosyası bulunamadı, geri alınamadı.",
      };
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

    return { ok: true, kayit: belgeyiDonustur(olusturulan) };
  } catch (error) {
    return {
      ok: false,
      mesaj:
        error instanceof Error ? error.message : "Belge geri alınamadı.",
    };
  }
}

export async function belgeDosyasiniTemizle(dosyaYolu: string) {
  const halaKayitli = await getPrisma().aracBelgesi.findFirst({
    where: { dosyaYolu },
    select: { id: true },
  });

  if (halaKayitli) return;

  await belgeDosyasiniSil(dosyaYolu);
}

export async function belgeGuncelle(
  aracId: number,
  belgeId: number,
  veri: { tur: string; baslik: string; aciklama: string },
): Promise<BelgeIslemSonucu> {
  try {
    if (!belgeTuruGecerliMi(veri.tur)) {
      return { ok: false, mesaj: "Geçerli bir belge türü seçin." };
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

    return { ok: true, kayit: belgeyiDonustur(kayit) };
  } catch (error) {
    return {
      ok: false,
      mesaj:
        error instanceof Error ? error.message : "Belge güncellenemedi.",
    };
  }
}
