import type {
  AracBilgiGecmisiKaydi,
  AracBilgiGecmisiTuru,
} from "@/app/lib/arac-bilgi-gecmisi";
import type { AracDetay } from "@/app/lib/arac-detay";
import { aracDurumunaDonustur } from "@/app/lib/arac-durumu";
import {
  markaAnahtariniNormalizeEt,
} from "@/app/lib/arac-grupla";
import {
  parcaKategoriGecerliMi,
  type AracParcaKaydi,
} from "@/app/lib/arac-parcalari";
import {
  markaGecerliMi,
  plakaNormalizeEt,
  type AracYonetimKaydi,
} from "@/app/lib/arac-yonetim";
import { getPrisma } from "@/app/lib/prisma";

export function gecmisKaydinaDonustur(kayit: {
  id: number;
  tur: string;
  tarih: Date | null;
  kilometre: number | null;
  servisAdi: string | null;
  aciklama: string | null;
  lastikTuru: string | null;
  kayitTarihi: Date;
}): AracBilgiGecmisiKaydi {
  return {
    id: kayit.id,
    tur: kayit.tur as AracBilgiGecmisiTuru,
    tarih: kayit.tarih?.toISOString() ?? null,
    kilometre: kayit.kilometre,
    servisAdi: kayit.servisAdi,
    aciklama: kayit.aciklama,
    lastikTuru: kayit.lastikTuru,
    kayitTarihi: kayit.kayitTarihi.toISOString(),
  };
}

export async function gecmiseEkle(
  aracId: number,
  tur: AracBilgiGecmisiTuru,
  veri: {
    tarih?: Date | null;
    kilometre?: number | null;
    servisAdi?: string | null;
    aciklama?: string | null;
    lastikTuru?: string | null;
  },
) {
  const dolu = Boolean(
    veri.tarih ||
      (veri.kilometre !== null && veri.kilometre !== undefined) ||
      veri.servisAdi?.trim() ||
      veri.aciklama?.trim() ||
      veri.lastikTuru?.trim(),
  );

  if (!dolu) return;

  await getPrisma().aracBilgiGecmisi.create({
    data: {
      aracId,
      tur,
      tarih: veri.tarih ?? null,
      kilometre: veri.kilometre ?? null,
      servisAdi: veri.servisAdi?.trim() || null,
      aciklama: veri.aciklama?.trim() || null,
      lastikTuru: veri.lastikTuru?.trim() || null,
    },
  });
}

function parcayiDonustur(parca: {
  kategori: string;
  sonDegisimTarihi: Date | null;
  sonDegisimKm: number | null;
  servisAdi: string | null;
  notlar: string | null;
}): AracParcaKaydi | null {
  if (!parcaKategoriGecerliMi(parca.kategori)) {
    return null;
  }

  return {
    kategori: parca.kategori,
    sonDegisimTarihi: parca.sonDegisimTarihi?.toISOString() ?? null,
    sonDegisimKm: parca.sonDegisimKm,
    servisAdi: parca.servisAdi,
    notlar: parca.notlar,
  };
}

export function araciDonustur(arac: {
  id: number;
  plaka: string;
  marka: string;
  model: string;
  yil: number;
  sasiNo: string | null;
  kilometre: number;
  aktifGorevdeMi: boolean;
  bakimdaMi: boolean;
  bakimTarihi: Date | null;
  bakimServisi: string | null;
  bakimKilometresi: number | null;
  bakimAciklamasi: string | null;
  lastikTuru: string | null;
  lastikTarihi: Date | null;
  lastikDegisimYeri: string | null;
  lastikMuhafazaYeri: string | null;
  atananKisi: string | null;
  atananKisiTelefon: string | null;
  parcalar: Array<{
    kategori: string;
    sonDegisimTarihi: Date | null;
    sonDegisimKm: number | null;
    servisAdi: string | null;
    notlar: string | null;
  }>;
}): AracDetay {
  return {
    id: arac.id,
    plaka: arac.plaka,
    marka: arac.marka,
    model: arac.model,
    yil: arac.yil,
    sasiNo: arac.sasiNo,
    kilometre: arac.kilometre,
    aktifGorevdeMi: arac.aktifGorevdeMi,
    bakimdaMi: arac.bakimdaMi,
    bakimTarihi: arac.bakimTarihi?.toISOString() ?? null,
    bakimServisi: arac.bakimServisi,
    bakimKilometresi: arac.bakimKilometresi,
    bakimAciklamasi: arac.bakimAciklamasi,
    lastikTuru: arac.lastikTuru,
    lastikTarihi: arac.lastikTarihi?.toISOString() ?? null,
    lastikDegisimYeri: arac.lastikDegisimYeri,
    lastikMuhafazaYeri: arac.lastikMuhafazaYeri,
    atananKisi: arac.atananKisi,
    atananKisiTelefon: arac.atananKisiTelefon,
    parcalar: arac.parcalar
      .map(parcayiDonustur)
      .filter((parca): parca is AracParcaKaydi => parca !== null),
  };
}

export function yonetimKaydinaDonustur(arac: {
  id: number;
  plaka: string;
  marka: string;
  model: string;
  yil: number;
  sasiNo: string | null;
  atananKisi: string | null;
  atananKisiTelefon: string | null;
  kilometre: number;
  aktifGorevdeMi: boolean;
  bakimdaMi: boolean;
}): AracYonetimKaydi {
  return {
    id: arac.id,
    plaka: arac.plaka,
    marka: arac.marka,
    model: arac.model,
    yil: arac.yil,
    sasiNo: arac.sasiNo,
    atananKisi: arac.atananKisi,
    atananKisiTelefon: arac.atananKisiTelefon,
    kilometre: arac.kilometre,
    aktifGorevdeMi: arac.aktifGorevdeMi,
    bakimdaMi: arac.bakimdaMi,
    durum: aracDurumunaDonustur(arac.aktifGorevdeMi, arac.bakimdaMi),
  };
}

export function temelAracFormunuDogrula(veri: {
  plaka: string;
  marka: string;
  model: string;
  yil: string;
}) {
  const plaka = plakaNormalizeEt(veri.plaka);
  if (!plaka) {
    throw new Error("Plaka zorunludur.");
  }

  const marka = markaAnahtariniNormalizeEt(veri.marka);
  if (!markaGecerliMi(marka)) {
    throw new Error("Geçerli bir marka seçin.");
  }

  const model = veri.model.trim().toLowerCase();
  if (!model) {
    throw new Error("Model zorunludur.");
  }

  const yil = Number(veri.yil);
  if (!Number.isInteger(yil) || yil < 1980 || yil > 2100) {
    throw new Error("Geçerli bir model yılı girin.");
  }

  return { plaka, marka, model, yil };
}

export async function benzersizlikKontrolEt(
  aracId: number | null,
  plaka: string,
  sasiNo: string | null,
) {
  const plakaCakismasi = await getPrisma().arac.findFirst({
    where: {
      plaka,
      ...(aracId ? { NOT: { id: aracId } } : {}),
    },
  });

  if (plakaCakismasi) {
    throw new Error("Bu plaka başka bir araçta kayıtlı.");
  }

  if (!sasiNo) return;

  const sasiCakismasi = await getPrisma().arac.findFirst({
    where: {
      sasiNo,
      ...(aracId ? { NOT: { id: aracId } } : {}),
    },
  });

  if (sasiCakismasi) {
    throw new Error("Bu şasi numarası başka bir araçta kayıtlı.");
  }
}

export function bakimKmDogrula(deger: string) {
  if (!deger.trim()) return null;

  const km = Number(deger);
  if (!Number.isFinite(km) || km < 0) {
    throw new Error("Geçerli bir bakım kilometresi girin.");
  }

  return Math.round(km);
}
