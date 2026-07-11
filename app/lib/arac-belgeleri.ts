export const BELGE_TURLERI = [
  "tutanak",
  "kaza_raporu",
  "sigorta",
  "bakim_evraki",
  "resmi_yazi",
  "diger",
] as const;

export type BelgeTuru = (typeof BELGE_TURLERI)[number];

export const BELGE_TURU_ETIKETLERI: Record<BelgeTuru, string> = {
  tutanak: "Tutanak",
  kaza_raporu: "Kaza raporu",
  sigorta: "Sigorta evrakı",
  bakim_evraki: "Bakım evrakı",
  resmi_yazi: "Resmi yazı",
  diger: "Diğer",
};

export const IZIN_VERILEN_BELGE_MIME_TURLERI = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAKSIMUM_BELGE_BOYUTU = 15 * 1024 * 1024;

export type AracBelgesiKaydi = {
  id: number;
  aracId: number;
  tur: BelgeTuru;
  baslik: string | null;
  aciklama: string | null;
  dosyaAdi: string;
  dosyaYolu: string;
  mimeType: string;
  boyut: number;
  yuklenmeTarihi: string;
};

export type BelgeYuklemeFormVerisi = {
  tur: BelgeTuru;
  baslik: string;
  aciklama: string;
};

export function belgeTuruGecerliMi(value: string): value is BelgeTuru {
  return BELGE_TURLERI.includes(value as BelgeTuru);
}

export function bosBelgeFormu(): BelgeYuklemeFormVerisi {
  return {
    tur: "tutanak",
    baslik: "",
    aciklama: "",
  };
}

export function belgeBoyutuFormatla(boyut: number) {
  if (boyut < 1024) return `${boyut} B`;
  if (boyut < 1024 * 1024) return `${(boyut / 1024).toFixed(1)} KB`;
  return `${(boyut / (1024 * 1024)).toFixed(1)} MB`;
}

export function belgeDosyaUzantisi(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return "PDF";
    case "image/jpeg":
      return "JPEG";
    case "image/png":
      return "PNG";
    case "image/webp":
      return "WEBP";
    case "application/msword":
      return "DOC";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "DOCX";
    default:
      return "Dosya";
  }
}
