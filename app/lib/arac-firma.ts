export type AracFirmaTuru = "bakim" | "fren_balata";

export type FirmaFormVerisi = {
  firmaAdi: string;
  telefon: string;
};

export type AracFirmaKaydi = {
  id: number;
  aracId: number;
  tur: AracFirmaTuru;
  firmaAdi: string | null;
  telefon: string | null;
  kayitTarihi: string;
};

export const ARAC_FIRMA_ETIKETLERI: Record<AracFirmaTuru, string> = {
  bakim: "Bakım için aranan firma",
  fren_balata: "Fren için aranan firma",
};

export function bosFirmaFormu(): FirmaFormVerisi {
  return {
    firmaAdi: "",
    telefon: "",
  };
}

export function firmaKaydiVarMi(
  kayit: Pick<AracFirmaKaydi, "firmaAdi" | "telefon"> | null | undefined,
) {
  return Boolean(kayit?.firmaAdi?.trim() || kayit?.telefon?.trim());
}

export function aracFirmaTuruGecerliMi(value: string): value is AracFirmaTuru {
  return value === "bakim" || value === "fren_balata";
}

export function firmaKaydiOzeti(kayit: AracFirmaKaydi) {
  const parcalar: string[] = [];

  if (kayit.firmaAdi?.trim()) {
    parcalar.push(kayit.firmaAdi.trim());
  }

  if (kayit.telefon?.trim()) {
    parcalar.push(kayit.telefon.trim());
  }

  return parcalar.join(" · ") || "Kayıt detayı yok";
}
