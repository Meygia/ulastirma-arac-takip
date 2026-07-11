import type { AracHasari, HasarTuru } from "@/app/lib/arac-hasarlari";
import { HASAR_TURU_RENKLERI } from "@/app/lib/arac-hasarlari";

export type KaportaSemaHasarTuru = Extract<
  HasarTuru,
  "cizik" | "gocuk" | "boya" | "degisen" | "lokal_boyali"
>;

export const KAPORTA_SEMA_HASAR_TURLERI: KaportaSemaHasarTuru[] = [
  "degisen",
  "boya",
  "lokal_boyali",
  "gocuk",
  "cizik",
];

export const KAPORTA_SEMA_HASAR_ONCELIGI: KaportaSemaHasarTuru[] = [
  "degisen",
  "boya",
  "lokal_boyali",
  "gocuk",
  "cizik",
];

/** Kaporta şemasında kullanılan renkler (Sahibinden ekspertiz paleti). */
export const KAPORTA_SEMA_RENKLERI: Record<KaportaSemaHasarTuru, string> = {
  degisen: "#E52525",
  boya: "#1E6FD6",
  lokal_boyali: "#F08C00",
  gocuk: "#8B4FD6",
  cizik: "#D4A017",
};

export const KAPORTA_ORIJINAL_RENK = "#B8BDC3";
export const KAPORTA_ORIJINAL_STROKE = "#95999E";

export type Arac360Yuz = "on" | "sol" | "arka" | "sag";

export type KaportaParcasi =
  | "on_tampon"
  | "kaput"
  | "tavan"
  | "bagaj"
  | "arka_tampon"
  | "sol_on_camurluk"
  | "sol_on_kapi"
  | "sol_arka_kapi"
  | "sol_arka_camurluk"
  | "sag_on_camurluk"
  | "sag_on_kapi"
  | "sag_arka_kapi"
  | "sag_arka_camurluk";

export const KAPORTA_PARCALARI: KaportaParcasi[] = [
  "on_tampon",
  "kaput",
  "tavan",
  "bagaj",
  "arka_tampon",
  "sol_on_camurluk",
  "sol_on_kapi",
  "sol_arka_kapi",
  "sol_arka_camurluk",
  "sag_on_camurluk",
  "sag_on_kapi",
  "sag_arka_kapi",
  "sag_arka_camurluk",
];

export const KAPORTA_PARCA_ETIKETLERI: Record<KaportaParcasi, string> = {
  on_tampon: "Ön tampon",
  kaput: "Kaput",
  tavan: "Tavan",
  bagaj: "Bagaj",
  arka_tampon: "Arka tampon",
  sol_on_camurluk: "Sol ön çamurluk",
  sol_on_kapi: "Sol ön kapı",
  sol_arka_kapi: "Sol arka kapı",
  sol_arka_camurluk: "Sol arka çamurluk",
  sag_on_camurluk: "Sağ ön çamurluk",
  sag_on_kapi: "Sağ ön kapı",
  sag_arka_kapi: "Sağ arka kapı",
  sag_arka_camurluk: "Sağ arka çamurluk",
};

const ETikET_PARCA_HARITASI = Object.fromEntries(
  Object.entries(KAPORTA_PARCA_ETIKETLERI).map(([parca, etiket]) => [
    etiket.toLowerCase(),
    parca as KaportaParcasi,
  ]),
) as Record<string, KaportaParcasi>;

const YUZ_HARITASI: Record<KaportaParcasi, Arac360Yuz> = {
  on_tampon: "on",
  kaput: "on",
  tavan: "on",
  bagaj: "arka",
  arka_tampon: "arka",
  sol_on_camurluk: "sol",
  sol_on_kapi: "sol",
  sol_arka_kapi: "sol",
  sol_arka_camurluk: "sol",
  sag_on_camurluk: "sag",
  sag_on_kapi: "sag",
  sag_arka_kapi: "sag",
  sag_arka_camurluk: "sag",
};

const BOLGE_ALTERNATIFLERI: Record<string, KaportaParcasi> = {
  "arka sol çamurluk": "sol_arka_camurluk",
  "sol arka çamurluk": "sol_arka_camurluk",
  "arka sağ çamurluk": "sag_arka_camurluk",
  "sağ arka çamurluk": "sag_arka_camurluk",
  "ön tampon": "on_tampon",
  "arka tampon": "arka_tampon",
  "sağ ön jant": "sag_on_camurluk",
  "sol ön jant": "sol_on_camurluk",
};

export function kaportaParcaEtiketi(parca: KaportaParcasi) {
  return KAPORTA_PARCA_ETIKETLERI[parca];
}

export function bolgeGosterimMetni(bolge: string) {
  const parca = kaportaParcaBul(bolge);
  return parca ? kaportaParcaEtiketi(parca) : bolge;
}

export function kaportaParcaBul(deger: string): KaportaParcasi | null {
  const normalized = deger.trim().toLowerCase();

  if (normalized in ETikET_PARCA_HARITASI) {
    return ETikET_PARCA_HARITASI[normalized];
  }

  if (normalized in BOLGE_ALTERNATIFLERI) {
    return BOLGE_ALTERNATIFLERI[normalized];
  }

  if (KAPORTA_PARCALARI.includes(normalized as KaportaParcasi)) {
    return normalized as KaportaParcasi;
  }

  return null;
}

/** Hasar kaydındaki bölge + açıklama/konum metninden parça çıkarır. */
export function kaportaParcaBulHasardan(hasar: AracHasari): KaportaParcasi | null {
  const dogrudan = kaportaParcaBul(hasar.bolge);
  if (dogrudan) return dogrudan;

  const metin = `${hasar.bolge} ${hasar.aciklama} ${hasar.konum}`.toLowerCase();

  for (const parca of KAPORTA_PARCALARI) {
    const etiket = KAPORTA_PARCA_ETIKETLERI[parca].toLowerCase();
    if (metin.includes(etiket)) {
      return parca;
    }
  }

  const yuzdeselIpucu: Array<{ anahtar: string; parca: KaportaParcasi }> = [
    { anahtar: "ön taraf", parca: "kaput" },
    { anahtar: "arka taraf", parca: "bagaj" },
    { anahtar: "sol taraf", parca: "sol_on_kapi" },
    { anahtar: "sağ taraf", parca: "sag_on_kapi" },
  ];

  for (const ipucu of yuzdeselIpucu) {
    if (metin.includes(ipucu.anahtar)) {
      return ipucu.parca;
    }
  }

  return null;
}

export function kaportaParcaGecerliMi(deger: string) {
  return kaportaParcaBul(deger) !== null;
}

/** Form/kayıt için standart slug döndürür. */
export function bolgeDepolamaDegeri(bolge: string) {
  const parca = kaportaParcaBul(bolge);
  return parca ? parca : bolge.trim();
}

export function kaportaParcaYuzBul(parca: KaportaParcasi): Arac360Yuz {
  return YUZ_HARITASI[parca];
}

export function kaportaParcaBulYuzden(
  yuz: Arac360Yuz,
  yuzdeX: number,
  yuzdeY: number,
): KaportaParcasi {
  switch (yuz) {
    case "on":
      // Önden bakış (LHD): sürücü tarafı (sol) görüntünün sağında
      if (yuzdeY > 0.58) return "on_tampon";
      if (yuzdeX > 0.68) return "sol_on_camurluk";
      if (yuzdeX < 0.32) return "sag_on_camurluk";
      if (yuzdeY < 0.22) return "tavan";
      return "kaput";
    case "arka":
      // Arkadan bakış: sürücü tarafı (sol) görüntünün solunda
      if (yuzdeY > 0.58) return "arka_tampon";
      if (yuzdeX < 0.32) return "sol_arka_camurluk";
      if (yuzdeX > 0.68) return "sag_arka_camurluk";
      if (yuzdeY < 0.22) return "tavan";
      return "bagaj";
    case "sol":
      // Sol profil: araç genelde sola bakar → ön düşük X, arka yüksek X
      if (yuzdeX < 0.2) return "sol_on_camurluk";
      if (yuzdeX > 0.8) return "sol_arka_camurluk";
      if (yuzdeX < 0.46) return "sol_on_kapi";
      return "sol_arka_kapi";
    case "sag":
      // Sağ profil: araç genelde sağa bakar → ön yüksek X, arka düşük X
      if (yuzdeX > 0.8) return "sag_on_camurluk";
      if (yuzdeX < 0.2) return "sag_arka_camurluk";
      if (yuzdeX > 0.54) return "sag_on_kapi";
      return "sag_arka_kapi";
  }
}

export function hasarlariParcalaraAyir(hasarlar: AracHasari[]) {
  const harita = new Map<KaportaParcasi, AracHasari[]>();

  for (const hasar of hasarlar) {
    const parca = kaportaParcaBulHasardan(hasar);
    if (!parca) continue;

    const mevcut = harita.get(parca) ?? [];
    mevcut.push(hasar);
    harita.set(parca, mevcut);
  }

  return harita;
}

export function kaportaSemaHasarlari(hasarlar: AracHasari[]) {
  return hasarlar.filter((hasar): hasar is AracHasari & { tur: KaportaSemaHasarTuru } =>
    KAPORTA_SEMA_HASAR_TURLERI.includes(hasar.tur as KaportaSemaHasarTuru),
  );
}

export function hasarlariKaportaSemasinaAyir(hasarlar: AracHasari[]) {
  return hasarlariParcalaraAyir(kaportaSemaHasarlari(hasarlar));
}

export function oncelikliKaportaHasarTuru(
  hasarlar: AracHasari[],
): KaportaSemaHasarTuru | null {
  for (const tur of KAPORTA_SEMA_HASAR_ONCELIGI) {
    if (hasarlar.some((hasar) => hasar.tur === tur)) {
      return tur;
    }
  }
  return null;
}

export function parcaKaportaSemasiRengi(hasarlar: AracHasari[]) {
  const tur = oncelikliKaportaHasarTuru(kaportaSemaHasarlari(hasarlar));
  if (!tur) {
    return {
      fill: KAPORTA_ORIJINAL_RENK,
      stroke: KAPORTA_ORIJINAL_STROKE,
    };
  }

  return {
    fill: KAPORTA_SEMA_RENKLERI[tur],
    stroke: KAPORTA_SEMA_RENKLERI[tur],
  };
}

export function parcaHasarRengi(hasarlar: AracHasari[]): string | null {
  if (hasarlar.length === 0) return null;
  return HASAR_TURU_RENKLERI[hasarlar[0].tur];
}

export function parcaHasarTuru(hasarlar: AracHasari[]): HasarTuru | null {
  if (hasarlar.length === 0) return null;
  return hasarlar[0].tur;
}
