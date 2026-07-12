"use server";

import {
  disKaynaktanKilometreleriCek,
  kmSenkronAyarlariniOku,
  kmSenkronHazirMi,
} from "@/app/lib/km-senkron";
import { getPrisma } from "@/app/lib/prisma";

export type KmSenkronDurumu = {
  aktif: boolean;
  hazir: boolean;
  kaynakUrlVar: boolean;
};

export type KmSenkronSonucu = {
  ok: boolean;
  guncellenen: number;
  eslesmeyen: string[];
  mesaj: string;
};

export async function kmSenkronDurumunuGetir(): Promise<KmSenkronDurumu> {
  const ayarlar = kmSenkronAyarlariniOku();
  return {
    aktif: ayarlar.aktif,
    hazir: kmSenkronHazirMi(ayarlar),
    kaynakUrlVar: Boolean(ayarlar.kaynakUrl),
  };
}

/**
 * Dış kaynaktan kilometreleri çekip plaka eşleşen araçlara yazar.
 * KM_SENKRON_AKTIF=true ve URL tanımlı olmadan çalışmaz.
 */
export async function kilometreleriSenkronizeEt(): Promise<KmSenkronSonucu> {
  const ayarlar = kmSenkronAyarlariniOku();

  if (!kmSenkronHazirMi(ayarlar)) {
    return {
      ok: false,
      guncellenen: 0,
      eslesmeyen: [],
      mesaj: "Kilometre senkronu pasif. Aktifleştirmek için ayarları tamamlayın.",
    };
  }

  const kayitlar = await disKaynaktanKilometreleriCek(ayarlar);
  const prisma = getPrisma();
  let guncellenen = 0;
  const eslesmeyen: string[] = [];

  for (const kayit of kayitlar) {
    const plaka = kayit.plaka.trim().toUpperCase();
    if (!plaka || !Number.isFinite(kayit.kilometre) || kayit.kilometre < 0) {
      continue;
    }

    const arac = await prisma.arac.findFirst({
      where: { plaka: { equals: plaka } },
    });

    if (!arac) {
      eslesmeyen.push(plaka);
      continue;
    }

    // Yalnızca daha yüksek (daha güncel) km yaz
    if (kayit.kilometre <= arac.kilometre) {
      continue;
    }

    await prisma.arac.update({
      where: { id: arac.id },
      data: { kilometre: Math.floor(kayit.kilometre) },
    });
    guncellenen += 1;
  }

  return {
    ok: true,
    guncellenen,
    eslesmeyen,
    mesaj: `${guncellenen} aracın kilometresi güncellendi.`,
  };
}
