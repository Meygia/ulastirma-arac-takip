import type { AracParcaKategorisi } from "@/app/lib/arac-parcalari";
import { kisaTarihFormatla } from "@/app/lib/arac-parcalari";
import { lastikTuruEtiketi } from "@/app/lib/arac-lastik";

export type AracBilgiGecmisiTuru =
  | "kilometre"
  | "bakim"
  | "lastik"
  | AracParcaKategorisi;

export type AracBilgiGecmisiKaydi = {
  id: number;
  tur: AracBilgiGecmisiTuru;
  tarih: string | null;
  kilometre: number | null;
  servisAdi: string | null;
  aciklama: string | null;
  lastikTuru: string | null;
  kayitTarihi: string;
};

export type BakimFormVerisi = {
  bakimTarihi: string;
  bakimServisi: string;
  bakimKilometresi: string;
  bakimAciklamasi: string;
};

export function bosBakimFormu(): BakimFormVerisi {
  return {
    bakimTarihi: "",
    bakimServisi: "",
    bakimKilometresi: "",
    bakimAciklamasi: "",
  };
}

export function bakimFormaDonustur(arac: {
  bakimTarihi: string | null;
  bakimServisi: string | null;
  bakimKilometresi: number | null;
  bakimAciklamasi: string | null;
}): BakimFormVerisi {
  return {
    bakimTarihi: arac.bakimTarihi?.slice(0, 10) ?? "",
    bakimServisi: arac.bakimServisi ?? "",
    bakimKilometresi: arac.bakimKilometresi?.toString() ?? "",
    bakimAciklamasi: arac.bakimAciklamasi ?? "",
  };
}

export function bakimKaydiVarMi(arac: {
  bakimTarihi: string | null;
  bakimServisi: string | null;
  bakimKilometresi: number | null;
  bakimAciklamasi: string | null;
}) {
  return Boolean(
    arac.bakimTarihi ||
      arac.bakimServisi?.trim() ||
      arac.bakimKilometresi !== null ||
      arac.bakimAciklamasi?.trim(),
  );
}

export function gecmisKaydiOzeti(kayit: AracBilgiGecmisiKaydi) {
  const parcalar: string[] = [];

  if (kayit.tur === "lastik" && kayit.lastikTuru) {
    parcalar.push(lastikTuruEtiketi(kayit.lastikTuru));
  }

  if (kayit.tarih) {
    parcalar.push(kisaTarihFormatla(kayit.tarih));
  }

  if (kayit.kilometre !== null) {
    parcalar.push(`${kayit.kilometre.toLocaleString("tr-TR")} km`);
  }

  if (kayit.servisAdi?.trim()) {
    parcalar.push(kayit.servisAdi.trim());
  }

  if (kayit.aciklama?.trim()) {
    parcalar.push(kayit.aciklama.trim());
  }

  return parcalar.join(" · ") || "Kayıt detayı yok";
}

export type GecmisFormVerisi = {
  tarih: string;
  kilometre: string;
  servisAdi: string;
  aciklama: string;
  lastikTuru: "" | "kislik" | "yazlik";
};

export function bosGecmisFormu(): GecmisFormVerisi {
  return {
    tarih: "",
    kilometre: "",
    servisAdi: "",
    aciklama: "",
    lastikTuru: "",
  };
}

export function gecmisKaydiniFormaDonustur(
  kayit: AracBilgiGecmisiKaydi,
): GecmisFormVerisi {
  const tur =
    kayit.lastikTuru === "kislik" || kayit.lastikTuru === "yazlik"
      ? kayit.lastikTuru
      : ("" as const);

  return {
    tarih: kayit.tarih?.slice(0, 10) ?? "",
    kilometre: kayit.kilometre?.toString() ?? "",
    servisAdi: kayit.servisAdi ?? "",
    aciklama: kayit.aciklama ?? "",
    lastikTuru: tur,
  };
}
