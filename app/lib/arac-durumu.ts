export type AracDurumu = "musait" | "gorevde" | "bakimda";

export const ARAC_DURUMLARI: AracDurumu[] = ["musait", "gorevde", "bakimda"];

export const ARAC_DURUM_ETIKETLERI: Record<AracDurumu, string> = {
  musait: "Müsait",
  gorevde: "Görevde",
  bakimda: "Bakımda",
};

export function aracDurumunaDonustur(
  aktifGorevdeMi: boolean,
  bakimdaMi: boolean,
): AracDurumu {
  if (bakimdaMi) return "bakimda";
  if (aktifGorevdeMi) return "gorevde";
  return "musait";
}

export function durumdanBoolean(durum: AracDurumu) {
  return {
    aktifGorevdeMi: durum === "gorevde",
    bakimdaMi: durum === "bakimda",
  };
}

export function aracDurumuSinifi(durum: AracDurumu) {
  switch (durum) {
    case "gorevde":
      return "bg-blue-950 text-blue-300 ring-blue-800";
    case "bakimda":
      return "bg-amber-950 text-amber-300 ring-amber-800";
    default:
      return "bg-emerald-950 text-emerald-300 ring-emerald-800";
  }
}
