"use server";

import { revalidatePath } from "next/cache";
import {
  benzersizlikKontrolEt,
  temelAracFormunuDogrula,
  yonetimKaydinaDonustur,
} from "@/app/lib/arac-server-yardimcisi";
import { durumdanBoolean } from "@/app/lib/arac-durumu";
import {
  type AracDuzenleFormVerisi,
  type AracEkleFormVerisi,
  type AracYonetimKaydi,
} from "@/app/lib/arac-yonetim";
import { aracKayitlariniSirala } from "@/app/lib/arac-grupla";
import { getPrisma } from "@/app/lib/prisma";

function yonetimSayfalariniYenile() {
  revalidatePath("/");
  revalidatePath("/arac-yonetimi");
}

export async function araclariYonetimIcinGetir(): Promise<AracYonetimKaydi[]> {
  const araclar = await getPrisma().arac.findMany();

  return aracKayitlariniSirala(araclar.map(yonetimKaydinaDonustur));
}

export async function aracEkle(veri: AracEkleFormVerisi) {
  const { plaka, marka, model, yil } = temelAracFormunuDogrula(veri);

  const kilometre = veri.kilometre.trim() ? Number(veri.kilometre) : 0;
  if (!Number.isFinite(kilometre) || kilometre < 0) {
    throw new Error("Geçerli bir kilometre değeri girin.");
  }

  const sasiNo = veri.sasiNo.trim() || null;
  const atananKisi = veri.atananKisi.trim() || null;
  const atananKisiTelefon = veri.atananKisiTelefon.trim() || null;

  await benzersizlikKontrolEt(null, plaka, sasiNo);

  const { aktifGorevdeMi, bakimdaMi } = durumdanBoolean(veri.durum);

  const arac = await getPrisma().arac.create({
    data: {
      plaka,
      marka,
      model,
      yil,
      sasiNo,
      atananKisi,
      atananKisiTelefon,
      kilometre: Math.round(kilometre),
      aktifGorevdeMi,
      bakimdaMi,
    },
  });

  yonetimSayfalariniYenile();

  return yonetimKaydinaDonustur(arac);
}

export async function aracGuncelle(aracId: number, veri: AracDuzenleFormVerisi) {
  const { plaka, marka, model, yil } = temelAracFormunuDogrula(veri);

  const sasiNo = veri.sasiNo.trim() || null;
  const atananKisi = veri.atananKisi.trim() || null;
  const atananKisiTelefon = veri.atananKisiTelefon.trim() || null;

  const mevcut = await getPrisma().arac.findUnique({ where: { id: aracId } });
  if (!mevcut) {
    throw new Error("Araç bulunamadı.");
  }

  await benzersizlikKontrolEt(aracId, plaka, sasiNo);

  const { aktifGorevdeMi, bakimdaMi } = durumdanBoolean(veri.durum);

  const arac = await getPrisma().arac.update({
    where: { id: aracId },
    data: {
      plaka,
      marka,
      model,
      yil,
      sasiNo,
      atananKisi,
      atananKisiTelefon,
      aktifGorevdeMi,
      bakimdaMi,
    },
  });

  yonetimSayfalariniYenile();

  return yonetimKaydinaDonustur(arac);
}

export async function aracSil(aracId: number) {
  await getPrisma().arac.delete({
    where: { id: aracId },
  });

  yonetimSayfalariniYenile();
}
