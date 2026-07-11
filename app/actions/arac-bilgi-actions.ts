"use server";

import { revalidatePath } from "next/cache";
import type {
  AracBilgiGecmisiKaydi,
  AracBilgiGecmisiTuru,
  BakimFormVerisi,
} from "@/app/lib/arac-bilgi-gecmisi";
import type { AracDetay } from "@/app/lib/arac-detay";
import type {
  AracFirmaKaydi,
  AracFirmaTuru,
  FirmaFormVerisi,
} from "@/app/lib/arac-firma";
import { aracFirmaTuruGecerliMi } from "@/app/lib/arac-firma";
import type { LastikFormVerisi } from "@/app/lib/arac-lastik";
import {
  araciDonustur,
  bakimKmDogrula,
  gecmiseEkle,
  gecmisKaydinaDonustur,
} from "@/app/lib/arac-server-yardimcisi";
import {
  parcaKategoriGecerliMi,
  type AracParcaFormVerisi,
  type AracParcaKategorisi,
} from "@/app/lib/arac-parcalari";
import { getPrisma } from "@/app/lib/prisma";

function aracFirmaKaydinaDonustur(kayit: {
  id: number;
  aracId: number;
  tur: string;
  firmaAdi: string | null;
  telefon: string | null;
  kayitTarihi: Date;
}): AracFirmaKaydi {
  return {
    id: kayit.id,
    aracId: kayit.aracId,
    tur: kayit.tur as AracFirmaTuru,
    firmaAdi: kayit.firmaAdi,
    telefon: kayit.telefon,
    kayitTarihi: kayit.kayitTarihi.toISOString(),
  };
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

export async function aracDetayGetir(aracId: number): Promise<AracDetay | null> {
  const arac = await getPrisma().arac.findUnique({
    where: { id: aracId },
    include: { parcalar: true },
  });

  if (!arac) return null;

  return araciDonustur(arac);
}

export async function aracBilgiGecmisiniGetir(
  aracId: number,
  tur: AracBilgiGecmisiTuru,
): Promise<AracBilgiGecmisiKaydi[]> {
  const kayitlar = await getPrisma().aracBilgiGecmisi.findMany({
    where: { aracId, tur },
    orderBy: [{ tarih: "desc" }, { kayitTarihi: "desc" }],
  });

  return kayitlar.map(gecmisKaydinaDonustur);
}

export async function aracBilgiGecmisSayilariniGetir(
  aracId: number,
): Promise<Partial<Record<AracBilgiGecmisiTuru, number>>> {
  const gruplar = await getPrisma().aracBilgiGecmisi.groupBy({
    by: ["tur"],
    where: { aracId },
    _count: { _all: true },
  });

  return Object.fromEntries(
    gruplar.map((grup) => [grup.tur, grup._count._all]),
  ) as Partial<Record<AracBilgiGecmisiTuru, number>>;
}

export async function aracFirmalariniGetir(
  aracId: number,
  tur: AracFirmaTuru,
): Promise<AracFirmaKaydi[]> {
  if (!aracFirmaTuruGecerliMi(tur)) {
    throw new Error("Geçersiz firma türü.");
  }

  await aracVarMi(aracId);

  const kayitlar = await getPrisma().aracFirma.findMany({
    where: { aracId, tur },
    orderBy: [{ kayitTarihi: "desc" }],
  });

  return kayitlar.map(aracFirmaKaydinaDonustur);
}

export async function aracFirmaKaydiEkle(
  aracId: number,
  tur: AracFirmaTuru,
  veri: FirmaFormVerisi,
) {
  if (!aracFirmaTuruGecerliMi(tur)) {
    throw new Error("Geçersiz firma türü.");
  }

  await aracVarMi(aracId);

  const firmaAdi = veri.firmaAdi.trim() || null;
  const telefon = veri.telefon.trim() || null;

  if (!firmaAdi && !telefon) {
    throw new Error("Firma adı veya telefon girin.");
  }

  const kayit = await getPrisma().aracFirma.create({
    data: {
      aracId,
      tur,
      firmaAdi,
      telefon,
    },
  });

  revalidatePath("/");

  return aracFirmaKaydinaDonustur(kayit);
}

export async function aracKilometreGuncelle(aracId: number, kilometre: number) {
  if (!Number.isFinite(kilometre) || kilometre < 0) {
    throw new Error("Geçerli bir kilometre değeri girin.");
  }

  const mevcut = await getPrisma().arac.findUniqueOrThrow({ where: { id: aracId } });
  const yeniKm = Math.round(kilometre);

  if (mevcut.kilometre !== yeniKm) {
    await gecmiseEkle(aracId, "kilometre", {
      tarih: new Date(),
      kilometre: mevcut.kilometre,
    });
  }

  const arac = await getPrisma().arac.update({
    where: { id: aracId },
    data: { kilometre: yeniKm },
    include: { parcalar: true },
  });

  revalidatePath("/");

  return araciDonustur(arac);
}

export async function aracBakimGuncelle(
  aracId: number,
  veri: BakimFormVerisi,
) {
  if (!veri.bakimTarihi) {
    throw new Error("Bakım tarihi zorunludur.");
  }

  if (!veri.bakimServisi.trim()) {
    throw new Error("Servis adı zorunludur.");
  }

  const bakimKm = bakimKmDogrula(veri.bakimKilometresi);

  await gecmiseEkle(aracId, "bakim", {
    tarih: new Date(veri.bakimTarihi),
    kilometre: bakimKm,
    servisAdi: veri.bakimServisi.trim(),
    aciklama: veri.bakimAciklamasi.trim() || null,
  });

  const arac = await getPrisma().arac.update({
    where: { id: aracId },
    data: {
      bakimTarihi: null,
      bakimServisi: null,
      bakimKilometresi: null,
      bakimAciklamasi: null,
    },
    include: { parcalar: true },
  });

  revalidatePath("/");

  return araciDonustur(arac);
}

export async function aracBakimSil(aracId: number) {
  const arac = await getPrisma().arac.update({
    where: { id: aracId },
    data: {
      bakimTarihi: null,
      bakimServisi: null,
      bakimKilometresi: null,
      bakimAciklamasi: null,
    },
    include: { parcalar: true },
  });

  revalidatePath("/");

  return araciDonustur(arac);
}

export async function aracLastikGuncelle(
  aracId: number,
  veri: LastikFormVerisi,
) {
  const lastikTuru =
    veri.lastikTuru === "kislik" || veri.lastikTuru === "yazlik"
      ? veri.lastikTuru
      : null;
  const lastikTarihi = veri.lastikTarihi ? new Date(veri.lastikTarihi) : null;
  const lastikDegisimYeri = veri.lastikDegisimYeri.trim() || null;
  const lastikMuhafazaYeri = veri.lastikMuhafazaYeri.trim() || null;

  if (
    !lastikTuru &&
    !lastikTarihi &&
    !lastikDegisimYeri &&
    !lastikMuhafazaYeri
  ) {
    throw new Error("En az bir lastik bilgisi girin.");
  }

  await gecmiseEkle(aracId, "lastik", {
    tarih: lastikTarihi,
    servisAdi: lastikDegisimYeri,
    aciklama: lastikMuhafazaYeri,
    lastikTuru,
  });

  const arac = await getPrisma().arac.update({
    where: { id: aracId },
    data: {
      lastikTuru: null,
      lastikTarihi: null,
      lastikDegisimYeri: null,
      lastikMuhafazaYeri: null,
    },
    include: { parcalar: true },
  });

  revalidatePath("/");

  return araciDonustur(arac);
}

export async function aracLastikSil(aracId: number) {
  const arac = await getPrisma().arac.update({
    where: { id: aracId },
    data: {
      lastikTuru: null,
      lastikTarihi: null,
      lastikDegisimYeri: null,
      lastikMuhafazaYeri: null,
    },
    include: { parcalar: true },
  });

  revalidatePath("/");

  return araciDonustur(arac);
}

export async function aracParcaGuncelle(
  aracId: number,
  kategori: AracParcaKategorisi,
  veri: AracParcaFormVerisi,
) {
  if (!parcaKategoriGecerliMi(kategori)) {
    throw new Error("Geçersiz parça kategorisi.");
  }

  const sonDegisimKm = veri.sonDegisimKm.trim()
    ? Number(veri.sonDegisimKm)
    : null;

  if (sonDegisimKm !== null && (!Number.isFinite(sonDegisimKm) || sonDegisimKm < 0)) {
    throw new Error("Geçerli bir kilometre değeri girin.");
  }

  const yeniTarih = veri.sonDegisimTarihi
    ? new Date(veri.sonDegisimTarihi)
    : null;
  const yeniKm =
    sonDegisimKm !== null ? Math.round(sonDegisimKm) : null;
  const yeniServis = veri.servisAdi.trim() || null;
  const yeniNotlar = veri.notlar.trim() || null;

  if (!yeniTarih && yeniKm === null && !yeniServis && !yeniNotlar) {
    throw new Error("En az bir parça bilgisi girin.");
  }

  await gecmiseEkle(aracId, kategori, {
    tarih: yeniTarih,
    kilometre: yeniKm,
    servisAdi: yeniServis,
    aciklama: yeniNotlar,
  });

  await getPrisma().aracParca.deleteMany({
    where: {
      aracId,
      kategori,
    },
  });

  const arac = await getPrisma().arac.findUniqueOrThrow({
    where: { id: aracId },
    include: { parcalar: true },
  });

  revalidatePath("/");

  return araciDonustur(arac);
}

export type GecmisGuncellemeVerisi = {
  tarih?: string;
  kilometre?: string;
  servisAdi?: string;
  aciklama?: string;
  lastikTuru?: string;
};

function gecmisKmDogrula(deger: string) {
  if (!deger.trim()) return null;

  const km = Number(deger);
  if (!Number.isFinite(km) || km < 0) {
    throw new Error("Geçerli bir kilometre değeri girin.");
  }

  return Math.round(km);
}

export async function aracBilgiGecmisiGuncelle(
  id: number,
  aracId: number,
  veri: GecmisGuncellemeVerisi,
) {
  const lastikTuru =
    veri.lastikTuru === "kislik" || veri.lastikTuru === "yazlik"
      ? veri.lastikTuru
      : null;

  const kayit = await getPrisma().aracBilgiGecmisi.update({
    where: { id, aracId },
    data: {
      tarih: veri.tarih ? new Date(veri.tarih) : null,
      kilometre: gecmisKmDogrula(veri.kilometre ?? ""),
      servisAdi: veri.servisAdi?.trim() || null,
      aciklama: veri.aciklama?.trim() || null,
      lastikTuru,
    },
  });

  revalidatePath("/");

  return gecmisKaydinaDonustur(kayit);
}

export async function aracBilgiGecmisiSil(id: number, aracId: number) {
  const kayit = await getPrisma().aracBilgiGecmisi.delete({
    where: { id, aracId },
  });

  revalidatePath("/");

  return gecmisKaydinaDonustur(kayit);
}

export async function aracBilgiGecmisiGeriYukle(
  aracId: number,
  kayit: Omit<AracBilgiGecmisiKaydi, "id">,
) {
  const olusturulan = await getPrisma().aracBilgiGecmisi.create({
    data: {
      aracId,
      tur: kayit.tur,
      tarih: kayit.tarih ? new Date(kayit.tarih) : null,
      kilometre: kayit.kilometre,
      servisAdi: kayit.servisAdi,
      aciklama: kayit.aciklama,
      lastikTuru: kayit.lastikTuru,
      kayitTarihi: new Date(kayit.kayitTarihi),
    },
  });

  revalidatePath("/");

  return gecmisKaydinaDonustur(olusturulan);
}

export async function aracFirmaGuncelle(
  id: number,
  aracId: number,
  veri: FirmaFormVerisi,
) {
  const kayit = await getPrisma().aracFirma.update({
    where: { id, aracId },
    data: {
      firmaAdi: veri.firmaAdi.trim() || null,
      telefon: veri.telefon.trim() || null,
    },
  });

  revalidatePath("/");

  return aracFirmaKaydinaDonustur(kayit);
}

export async function aracFirmaSil(id: number, aracId: number) {
  const kayit = await getPrisma().aracFirma.delete({
    where: { id, aracId },
  });

  revalidatePath("/");

  return aracFirmaKaydinaDonustur(kayit);
}

export async function aracFirmaGeriYukle(kayit: Omit<AracFirmaKaydi, "id">) {
  const olusturulan = await getPrisma().aracFirma.create({
    data: {
      aracId: kayit.aracId,
      tur: kayit.tur,
      firmaAdi: kayit.firmaAdi,
      telefon: kayit.telefon,
      kayitTarihi: new Date(kayit.kayitTarihi),
    },
  });

  revalidatePath("/");

  return aracFirmaKaydinaDonustur(olusturulan);
}

export async function aracParcaSil(
  aracId: number,
  kategori: AracParcaKategorisi,
) {
  if (!parcaKategoriGecerliMi(kategori)) {
    throw new Error("Geçersiz parça kategorisi.");
  }

  await getPrisma().aracParca.deleteMany({
    where: {
      aracId,
      kategori,
    },
  });

  const arac = await getPrisma().arac.findUniqueOrThrow({
    where: { id: aracId },
    include: { parcalar: true },
  });

  revalidatePath("/");

  return araciDonustur(arac);
}
