import {
  aracDurumunaDonustur,
  durumdanBoolean,
  type AracDurumu,
} from "@/app/lib/arac-durumu";
import {
  markaAnahtariniNormalizeEt,
  turkceMetinKarsilastir,
  TANIMLI_MARKALAR,
  SIRALI_TANIMLI_MARKALAR,
} from "@/app/lib/arac-grupla";

export type { AracDurumu };

export type AracYonetimKaydi = {
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
  durum: AracDurumu;
};

export type AracEkleFormVerisi = {
  plaka: string;
  marka: string;
  model: string;
  yil: string;
  sasiNo: string;
  atananKisi: string;
  atananKisiTelefon: string;
  kilometre: string;
  durum: AracDurumu;
};

export type AracDuzenleFormVerisi = {
  plaka: string;
  marka: string;
  model: string;
  yil: string;
  sasiNo: string;
  atananKisi: string;
  atananKisiTelefon: string;
  durum: AracDurumu;
};

export const MARKA_MODELLERI: Partial<
  Record<(typeof TANIMLI_MARKALAR)[number], string[]>
> = {
  renault: ["megane"],
  audi: ["a6", "a8l"],
  toyota: ["corolla"],
  togg: ["t10x", "t10f"],
  skoda: ["superb"],
  ford: ["tourneo"],
};

export function markaModelleriBul(marka: string) {
  const anahtar = markaAnahtariniNormalizeEt(
    marka,
  ) as (typeof TANIMLI_MARKALAR)[number];

  return [...(MARKA_MODELLERI[anahtar] ?? [])].sort(turkceMetinKarsilastir);
}

export function bosAracEkleFormu(): AracEkleFormVerisi {
  const marka = SIRALI_TANIMLI_MARKALAR[0];
  const modeller = markaModelleriBul(marka);

  return {
    plaka: "",
    marka,
    model: modeller[0] ?? "",
    yil: new Date().getFullYear().toString(),
    sasiNo: "",
    atananKisi: "",
    atananKisiTelefon: "",
    kilometre: "0",
    durum: "musait",
  };
}

export function araciDuzenleFormunaDonustur(
  arac: AracYonetimKaydi,
): AracDuzenleFormVerisi {
  return {
    plaka: arac.plaka,
    marka: markaAnahtariniNormalizeEt(arac.marka),
    model: arac.model,
    yil: arac.yil.toString(),
    sasiNo: arac.sasiNo ?? "",
    atananKisi: arac.atananKisi ?? "",
    atananKisiTelefon: arac.atananKisiTelefon ?? "",
    durum: arac.durum,
  };
}

export function markaGecerliMi(value: string) {
  return TANIMLI_MARKALAR.includes(
    markaAnahtariniNormalizeEt(value) as (typeof TANIMLI_MARKALAR)[number],
  );
}

export function plakaNormalizeEt(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}
