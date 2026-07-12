/**
 * cibmutfak Araç Takip sitesinden güncel kilometre (Giriş KM / currentKm) çeker.
 */

export type KmSenkronAyarlari = {
  aktif: boolean;
  kaynakUrl: string | null;
  sifre: string | null;
};

export type KmSenkronKaydi = {
  plaka: string;
  kilometre: number;
  okumaZamani: string | null;
};

type DisAracKaydi = {
  plate?: string;
  plaka?: string;
  currentKm?: number;
  girisKm?: number;
};

export function kmSenkronAyarlariniOku(): KmSenkronAyarlari {
  const aktif =
    (process.env.KM_SENKRON_AKTIF ?? "").trim().toLowerCase() === "true";
  const kaynakUrl = (process.env.KM_SENKRON_URL ?? "").trim().replace(/\/$/, "") || null;
  const sifre =
    (process.env.KM_SENKRON_SIFRE ?? process.env.KM_SENKRON_API_KEY ?? "").trim() ||
    null;

  return { aktif, kaynakUrl, sifre };
}

export function kmSenkronHazirMi(ayarlar = kmSenkronAyarlariniOku()) {
  return Boolean(ayarlar.aktif && ayarlar.kaynakUrl && ayarlar.sifre);
}

export function plakaNormalize(plaka: string) {
  return plaka
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/İ/g, "I")
    .replace(/\s+/g, "");
}

function trpcInput(sifre: string) {
  return encodeURIComponent(JSON.stringify({ "0": { json: { password: sifre } } }));
}

function kayitlariAyikla(payload: unknown): DisAracKaydi[] {
  if (Array.isArray(payload)) {
    const ilk = payload[0] as { result?: { data?: { json?: unknown } } } | undefined;
    const json = ilk?.result?.data?.json;
    if (Array.isArray(json)) return json as DisAracKaydi[];
  }

  if (payload && typeof payload === "object" && "result" in payload) {
    const json = (payload as { result?: { data?: { json?: unknown } } }).result
      ?.data?.json;
    if (Array.isArray(json)) return json as DisAracKaydi[];
  }

  return [];
}

async function trpcGet(baseUrl: string, procedure: string, sifre: string) {
  const url = `${baseUrl}/api/trpc/${procedure}?batch=1&input=${trpcInput(sifre)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`KM kaynağı hata verdi (${procedure}: ${response.status}).`);
  }

  return response.json();
}

/**
 * Önce vehicles.list (currentKm) dener; olmazsa admin.records'tan
 * her plaka için en güncel girisKm alınır.
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

  if (!ayarlar.sifre) {
    throw new Error("KM_SENKRON_SIFRE tanımlı değil.");
  }

  try {
    const vehiclesPayload = await trpcGet(
      ayarlar.kaynakUrl,
      "vehicles.list",
      ayarlar.sifre,
    );
    const vehicles = kayitlariAyikla(vehiclesPayload);

    const fromVehicles: KmSenkronKaydi[] = [];
    for (const arac of vehicles) {
      const plaka = (arac.plate ?? arac.plaka ?? "").trim();
      const km = Number(arac.currentKm ?? arac.girisKm);
      if (!plaka || !Number.isFinite(km) || km < 0) continue;
      fromVehicles.push({
        plaka,
        kilometre: Math.floor(km),
        okumaZamani: new Date().toISOString(),
      });
    }

    if (fromVehicles.length > 0) {
      return fromVehicles;
    }
  } catch {
    // records yedekine düş
  }

  const recordsPayload = await trpcGet(
    ayarlar.kaynakUrl,
    "admin.records",
    ayarlar.sifre,
  );
  const records = kayitlariAyikla(recordsPayload);
  const enGuncel = new Map<string, KmSenkronKaydi & { sira: number }>();

  for (const kayit of records) {
    const plaka = (kayit.plaka ?? kayit.plate ?? "").trim();
    const km = Number(kayit.girisKm ?? kayit.currentKm);
    if (!plaka || !Number.isFinite(km) || km < 0) continue;

    const key = plakaNormalize(plaka);
    const girisSaati = Number((kayit as { girisSaati?: number }).girisSaati ?? NaN);
    const createdAtMs = Date.parse(
      String((kayit as { createdAt?: string }).createdAt ?? ""),
    );
    const sira = Number.isFinite(girisSaati)
      ? girisSaati
      : Number.isFinite(createdAtMs)
        ? createdAtMs
        : 0;
    const onceki = enGuncel.get(key);
    if (!onceki || sira >= onceki.sira || km >= onceki.kilometre) {
      enGuncel.set(key, {
        plaka,
        kilometre: Math.floor(km),
        okumaZamani: new Date().toISOString(),
        sira,
      });
    }
  }

  return [...enGuncel.values()].map(({ plaka, kilometre, okumaZamani }) => ({
    plaka,
    kilometre,
    okumaZamani,
  }));
}
