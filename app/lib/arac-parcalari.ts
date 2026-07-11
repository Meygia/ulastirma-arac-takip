export type AracParcaKategorisi =
  | "baski_balata"
  | "fren_balata"
  | "fren_diski";

export type AracParcaKaydi = {
  kategori: AracParcaKategorisi;
  sonDegisimTarihi: string | null;
  sonDegisimKm: number | null;
  servisAdi: string | null;
  notlar: string | null;
};

export type AracParcaFormVerisi = {
  sonDegisimTarihi: string;
  sonDegisimKm: string;
  servisAdi: string;
  notlar: string;
};

export const ARAC_PARCA_KATEGORILERI: AracParcaKategorisi[] = [
  "baski_balata",
  "fren_balata",
  "fren_diski",
];

export const ARAC_PARCA_ETIKETLERI: Record<AracParcaKategorisi, string> = {
  baski_balata: "Baskı Balatası",
  fren_balata: "Fren Balatası",
  fren_diski: "Fren Diski",
};

export function parcaKategoriGecerliMi(
  value: string,
): value is AracParcaKategorisi {
  return ARAC_PARCA_KATEGORILERI.includes(value as AracParcaKategorisi);
}

export function bosParcaFormu(): AracParcaFormVerisi {
  return {
    sonDegisimTarihi: "",
    sonDegisimKm: "",
    servisAdi: "",
    notlar: "",
  };
}

export function parcaKaydiVarMi(parca: AracParcaKaydi | undefined) {
  if (!parca) return false;

  return Boolean(
    parca.sonDegisimTarihi ||
      parca.sonDegisimKm !== null ||
      parca.servisAdi?.trim() ||
      parca.notlar?.trim(),
  );
}

export function parcayiFormaDonustur(
  parca: AracParcaKaydi | undefined,
): AracParcaFormVerisi {
  return {
    sonDegisimTarihi: parca?.sonDegisimTarihi?.slice(0, 10) ?? "",
    sonDegisimKm: parca?.sonDegisimKm?.toString() ?? "",
    servisAdi: parca?.servisAdi ?? "",
    notlar: parca?.notlar ?? "",
  };
}

export function kisaTarihFormatla(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
