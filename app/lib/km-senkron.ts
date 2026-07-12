/**
 * Dış kaynaktan canlı kilometre aktarımı.
 * Şimdilik iskelet — KM_SENKRON_AKTIF=true olmadan hiçbir şey çalışmaz.
 * Link ve API detayları geldiğinde burası doldurulacak.
 */

export type KmSenkronAyarlari = {
  aktif: boolean;
  kaynakUrl: string | null;
  apiAnahtari: string | null;
};

export type KmSenkronKaydi = {
  plaka: string;
  kilometre: number;
  okumaZamani: string | null;
};

export function kmSenkronAyarlariniOku(): KmSenkronAyarlari {
  const aktif =
    (process.env.KM_SENKRON_AKTIF ?? "").trim().toLowerCase() === "true";
  const kaynakUrl = (process.env.KM_SENKRON_URL ?? "").trim() || null;
  const apiAnahtari = (process.env.KM_SENKRON_API_KEY ?? "").trim() || null;

  return { aktif, kaynakUrl, apiAnahtari };
}

export function kmSenkronHazirMi(ayarlar = kmSenkronAyarlariniOku()) {
  return Boolean(ayarlar.aktif && ayarlar.kaynakUrl);
}

/**
 * Dış siteden kilometre listesini çeker.
 * Aktif değilken veya URL yokken bilinçli olarak hata verir.
 */
export async function disKaynaktanKilometreleriCek(
  ayarlar = kmSenkronAyarlariniOku(),
): Promise<KmSenkronKaydi[]> {
  if (!ayarlar.aktif) {
    throw new Error("Kilometre senkronu kapalı (KM_SENKRON_AKTIF=false).");
  }

  if (!ayarlar.kaynakUrl) {
    throw new Error("KM_SENKRON_URL tanımlı değil.");
  }

  // TODO: Kaynak site linki ve yanıt formatı netleşince burası yazılacak.
  // Örnek beklenen yapı: [{ plaka, kilometre, okumaZamani? }]
  throw new Error(
    "Kilometre senkronu henüz bağlanmadı. Kaynak linki geldiğinde tamamlanacak.",
  );
}
