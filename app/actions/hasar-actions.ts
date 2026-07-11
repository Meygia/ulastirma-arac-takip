"use server";

import { revalidatePath } from "next/cache";
import {
  hasarTuruGecerliMi,
  type AracHasari,
  type HasarFormVerisi,
} from "@/app/lib/arac-hasarlari";
import { kaportaParcaGecerliMi, bolgeDepolamaDegeri } from "@/app/lib/hasar-bolgeleri";
import { getPrisma } from "@/app/lib/prisma";

function hasariDonustur(hasar: {
  id: number;
  aracId: number;
  tur: string;
  bolge: string;
  konum: string;
  tarih: Date;
  aciklama: string;
  gorunumAcisi: number;
  gorunumToleransi: number;
  gorunumBaslangicKare: number | null;
  gorunumBitisKare: number | null;
  yuzdeX: number;
  yuzdeY: number;
}): AracHasari {
  if (!hasarTuruGecerliMi(hasar.tur)) {
    throw new Error("Geçersiz hasar türü.");
  }

  return {
    id: hasar.id,
    aracId: hasar.aracId,
    tur: hasar.tur,
    bolge: bolgeDepolamaDegeri(hasar.bolge),
    konum: hasar.konum,
    tarih: hasar.tarih.toISOString(),
    aciklama: hasar.aciklama,
    gorunumAcisi: hasar.gorunumAcisi,
    gorunumToleransi: hasar.gorunumToleransi,
    gorunumBaslangicKare: hasar.gorunumBaslangicKare,
    gorunumBitisKare: hasar.gorunumBitisKare,
    yuzdeX: hasar.yuzdeX,
    yuzdeY: hasar.yuzdeY,
  };
}

function formuDogrula(veri: HasarFormVerisi) {
  if (!hasarTuruGecerliMi(veri.tur)) {
    throw new Error("Hasar türü seçilmelidir.");
  }

  const otomatik360 =
    veri.gorunumBaslangicKare !== null && veri.gorunumBitisKare !== null;

  if (!kaportaParcaGecerliMi(veri.bolge)) {
    throw new Error("Kaporta parçası seçilmelidir.");
  }

  if (!otomatik360 && !veri.konum.trim()) {
    throw new Error("Hasar konumu zorunludur.");
  }

  if (!otomatik360 && !veri.aciklama.trim()) {
    throw new Error("Açıklama zorunludur.");
  }

  if (!veri.tarih) {
    throw new Error("Tarih zorunludur.");
  }
}

function formuKaydaHazirla(veri: HasarFormVerisi): HasarFormVerisi {
  const otomatik360 =
    veri.gorunumBaslangicKare !== null && veri.gorunumBitisKare !== null;

  return {
    ...veri,
    bolge: bolgeDepolamaDegeri(veri.bolge),
    konum:
      veri.konum.trim() ||
      (otomatik360 ? "Araç üzerinde işaretlendi" : ""),
    aciklama: veri.aciklama.trim() || (otomatik360 ? "—" : veri.aciklama),
  };
}

export async function hasarlariGetir(aracId: number): Promise<AracHasari[]> {
  const hasarlar = await getPrisma().hasar.findMany({
    where: { aracId },
    orderBy: { tarih: "desc" },
  });

  return hasarlar.map(hasariDonustur);
}

export async function hasarEkle(aracId: number, veri: HasarFormVerisi) {
  const kayit = formuKaydaHazirla(veri);
  formuDogrula(kayit);

  const hasar = await getPrisma().hasar.create({
    data: {
      aracId,
      tur: kayit.tur,
      bolge: kayit.bolge.trim(),
      konum: kayit.konum.trim(),
      tarih: new Date(kayit.tarih),
      aciklama: kayit.aciklama.trim(),
      gorunumAcisi: kayit.gorunumAcisi,
      gorunumToleransi: kayit.gorunumToleransi,
      gorunumBaslangicKare: kayit.gorunumBaslangicKare,
      gorunumBitisKare: kayit.gorunumBitisKare,
      yuzdeX: kayit.yuzdeX,
      yuzdeY: kayit.yuzdeY,
    },
  });

  revalidatePath("/");

  return hasariDonustur(hasar);
}

export async function hasarGuncelle(hasarId: number, veri: HasarFormVerisi) {
  const kayit = formuKaydaHazirla(veri);
  formuDogrula(kayit);

  const hasar = await getPrisma().hasar.update({
    where: { id: hasarId },
    data: {
      tur: kayit.tur,
      bolge: kayit.bolge.trim(),
      konum: kayit.konum.trim(),
      tarih: new Date(kayit.tarih),
      aciklama: kayit.aciklama.trim(),
      gorunumAcisi: kayit.gorunumAcisi,
      gorunumToleransi: kayit.gorunumToleransi,
      gorunumBaslangicKare: kayit.gorunumBaslangicKare,
      gorunumBitisKare: kayit.gorunumBitisKare,
      yuzdeX: kayit.yuzdeX,
      yuzdeY: kayit.yuzdeY,
    },
  });

  revalidatePath("/");

  return hasariDonustur(hasar);
}

export async function hasarSil(hasarId: number) {
  await getPrisma().hasar.delete({
    where: { id: hasarId },
  });

  revalidatePath("/");
}
