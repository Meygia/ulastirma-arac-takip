"use server";

import { revalidatePath } from "next/cache";
import {
  disKaynaktanKilometreleriCek,
  kmSenkronAyarlariniOku,
  kmSenkronHazirMi,
  plakaNormalize,
} from "@/app/lib/km-senkron";
import { getPrisma } from "@/app/lib/prisma";

export type KmSenkronDurumu = {
  aktif: boolean;
  hazir: boolean;
  kaynakUrlVar: boolean;
  sifreVar: boolean;
};

export type KmSenkronSonucu = {
  ok: boolean;
  guncellenen: number;
  atlanan: number;
  eslesmeyen: string[];
  mesaj: string;
};

const globalSenkron = globalThis as unknown as {
  kmSenkronSonDeneme?: number;
};

export async function kmSenkronDurumunuGetir(): Promise<KmSenkronDurumu> {
  const ayarlar = kmSenkronAyarlariniOku();
  return {
    aktif: ayarlar.aktif,
    hazir: kmSenkronHazirMi(ayarlar),
    kaynakUrlVar: Boolean(ayarlar.kaynakUrl),
    sifreVar: Boolean(ayarlar.sifre),
  };
}

/**
 * Dış kaynaktaki currentKm / Giriş KM değerlerini plaka eşleşmesiyle yazar.
 * Geçmiş kaydı oluşturmaz (sürekli senkron spam olmasın diye).
 */
export async function kilometreleriSenkronizeEt(options?: {
  zorla?: boolean;
  minAralikMs?: number;
}): Promise<KmSenkronSonucu> {
  const ayarlar = kmSenkronAyarlariniOku();

  if (!kmSenkronHazirMi(ayarlar)) {
    return {
      ok: false,
      guncellenen: 0,
      atlanan: 0,
      eslesmeyen: [],
      mesaj: "Kilometre senkronu pasif veya eksik yapılandırılmış.",
    };
  }

  const minAralik = options?.minAralikMs ?? 90_000;
  const simdi = Date.now();
  if (
    !options?.zorla &&
    globalSenkron.kmSenkronSonDeneme &&
    simdi - globalSenkron.kmSenkronSonDeneme < minAralik
  ) {
    return {
      ok: true,
      guncellenen: 0,
      atlanan: 0,
      eslesmeyen: [],
      mesaj: "Son senkron çok yeni, atlandı.",
    };
  }
  globalSenkron.kmSenkronSonDeneme = simdi;

  try {
    const kayitlar = await disKaynaktanKilometreleriCek(ayarlar);
    const prisma = getPrisma();
    const araclar = await prisma.arac.findMany({
      select: { id: true, plaka: true, kilometre: true },
    });

    const aracMap = new Map(
      araclar.map((arac) => [plakaNormalize(arac.plaka), arac]),
    );

    let guncellenen = 0;
    let atlanan = 0;
    const eslesmeyen: string[] = [];
    const eslesenPlakalar = new Set<string>();

    for (const kayit of kayitlar) {
      const anahtar = plakaNormalize(kayit.plaka);
      const arac = aracMap.get(anahtar);

      if (!arac) {
        eslesmeyen.push(kayit.plaka);
        continue;
      }

      eslesenPlakalar.add(anahtar);
      const yeniKm = Math.floor(kayit.kilometre);

      if (arac.kilometre === yeniKm) {
        atlanan += 1;
        continue;
      }

      await prisma.arac.update({
        where: { id: arac.id },
        data: { kilometre: yeniKm },
      });
      guncellenen += 1;
    }

    if (guncellenen > 0) {
      revalidatePath("/");
    }

    return {
      ok: true,
      guncellenen,
      atlanan,
      eslesmeyen,
      mesaj:
        guncellenen > 0
          ? `${guncellenen} aracın kilometresi güncellendi.`
          : "Tüm eşleşen plakalar zaten güncel.",
    };
  } catch (error) {
    return {
      ok: false,
      guncellenen: 0,
      atlanan: 0,
      eslesmeyen: [],
      mesaj:
        error instanceof Error
          ? error.message
          : "Kilometre senkronu başarısız oldu.",
    };
  }
}
