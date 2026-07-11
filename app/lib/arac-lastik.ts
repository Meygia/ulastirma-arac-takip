export type LastikTuru = "kislik" | "yazlik";

export type LastikFormVerisi = {
  lastikTuru: LastikTuru | "";
  lastikTarihi: string;
  lastikDegisimYeri: string;
  lastikMuhafazaYeri: string;
};

export const LASTIK_TURU_ETIKETLERI: Record<LastikTuru, string> = {
  kislik: "Kışlık",
  yazlik: "Yazlık",
};

export function bosLastikFormu(): LastikFormVerisi {
  return {
    lastikTuru: "",
    lastikTarihi: "",
    lastikDegisimYeri: "",
    lastikMuhafazaYeri: "",
  };
}

export function lastikFormaDonustur(arac: {
  lastikTuru: string | null;
  lastikTarihi: string | null;
  lastikDegisimYeri: string | null;
  lastikMuhafazaYeri: string | null;
}): LastikFormVerisi {
  const tur = arac.lastikTuru;
  const gecerliTur =
    tur === "kislik" || tur === "yazlik" ? tur : ("" as const);

  return {
    lastikTuru: gecerliTur,
    lastikTarihi: arac.lastikTarihi?.slice(0, 10) ?? "",
    lastikDegisimYeri: arac.lastikDegisimYeri ?? "",
    lastikMuhafazaYeri: arac.lastikMuhafazaYeri ?? "",
  };
}

export function lastikKaydiVarMi(arac: {
  lastikTuru: string | null;
  lastikTarihi: string | null;
  lastikDegisimYeri: string | null;
  lastikMuhafazaYeri: string | null;
}) {
  return Boolean(
    arac.lastikTuru ||
      arac.lastikTarihi ||
      arac.lastikDegisimYeri?.trim() ||
      arac.lastikMuhafazaYeri?.trim(),
  );
}

export function lastikTuruEtiketi(tur: string | null) {
  if (tur === "kislik" || tur === "yazlik") {
    return LASTIK_TURU_ETIKETLERI[tur];
  }

  return "—";
}
