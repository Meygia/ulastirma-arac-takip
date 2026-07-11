import type { AracCizimOlculeri } from "@/app/lib/arac-cizim";
import {
  kaportaParcaBul,
  kaportaParcaBulYuzden,
  kaportaParcaYuzBul,
  type KaportaParcasi,
} from "@/app/lib/hasar-bolgeleri";

export type Arac360KareAraligi = {
  baslangic: number;
  bitis: number;
};

export type Arac360Yuz = "on" | "sol" | "arka" | "sag";

export type Arac360Konfig = {
  kareSayisi: number;
  goruntuYolu: (index: number) => string;
  kareAraligiBelirle: (
    yuzdeX: number,
    yuzdeY: number,
  ) => Arac360KareAraligi;
  yuzKareAraliklari: Record<Arac360Yuz, Arac360KareAraligi>;
  yuzMerkezKare: Record<Arac360Yuz, number>;
};

const YUZ_ETIKETLERI: Record<Arac360Yuz, string> = {
  on: "Ön taraf",
  sol: "Sol taraf",
  arka: "Arka taraf",
  sag: "Sağ taraf",
};

export const MEGANE_YUZ_ETIKETLERI = YUZ_ETIKETLERI;

const YUZLER: Arac360Yuz[] = ["on", "sol", "arka", "sag"];

const MEGANE_YUZ_KARE_ARALIKLARI: Record<Arac360Yuz, Arac360KareAraligi> = {
  on: { baslangic: 22, bitis: 3 },
  sol: { baslangic: 4, bitis: 10 },
  arka: { baslangic: 11, bitis: 15 },
  sag: { baslangic: 16, bitis: 21 },
};

const MEGANE_YUZ_MERKEZ_KARE: Record<Arac360Yuz, number> = {
  on: 1,
  sol: 7,
  arka: 13,
  sag: 18,
};

const AUDI_A6_YUZ_KARE_ARALIKLARI: Record<Arac360Yuz, Arac360KareAraligi> = {
  on: { baslangic: 33, bitis: 4 },
  sol: { baslangic: 5, bitis: 15 },
  arka: { baslangic: 16, bitis: 23 },
  sag: { baslangic: 24, bitis: 32 },
};

const AUDI_A6_YUZ_MERKEZ_KARE: Record<Arac360Yuz, number> = {
  on: 1,
  sol: 10,
  arka: 19,
  sag: 28,
};

function kareMerkezMesafesi(
  kare: number,
  merkez: number,
  kareSayisi: number,
) {
  const fark = Math.abs(kare - merkez);
  return Math.min(fark, kareSayisi - fark);
}

export function yuzBulKareden(
  kare: number,
  konfig: Pick<
    Arac360Konfig,
    "kareSayisi" | "yuzKareAraliklari" | "yuzMerkezKare"
  >,
): Arac360Yuz {
  let enYakinYuz: Arac360Yuz = "on";
  let enKucukMesafe = Number.POSITIVE_INFINITY;

  for (const yuz of YUZLER) {
    const aralik = konfig.yuzKareAraliklari[yuz];

    if (!kareAraligindaMi(kare, aralik.baslangic, aralik.bitis)) {
      continue;
    }

    const mesafe = kareMerkezMesafesi(
      kare,
      konfig.yuzMerkezKare[yuz],
      konfig.kareSayisi,
    );

    if (mesafe < enKucukMesafe) {
      enKucukMesafe = mesafe;
      enYakinYuz = yuz;
    }
  }

  if (enKucukMesafe === Number.POSITIVE_INFINITY) {
    for (const yuz of YUZLER) {
      const mesafe = kareMerkezMesafesi(
        kare,
        konfig.yuzMerkezKare[yuz],
        konfig.kareSayisi,
      );

      if (mesafe < enKucukMesafe) {
        enKucukMesafe = mesafe;
        enYakinYuz = yuz;
      }
    }
  }

  return enYakinYuz;
}

export function meganeYuzBulKareden(kare: number) {
  return yuzBulKareden(kare, {
    kareSayisi: 24,
    yuzKareAraliklari: MEGANE_YUZ_KARE_ARALIKLARI,
    yuzMerkezKare: MEGANE_YUZ_MERKEZ_KARE,
  });
}

export function kareAraligiBolgeden(
  bolge: string,
  konfig: Arac360Konfig,
): Arac360KareAraligi | null {
  const parca = kaportaParcaBul(bolge);
  if (parca) {
    const yuz = kaportaParcaYuzBul(parca);
    return konfig.yuzKareAraliklari[yuz];
  }

  for (const yuz of YUZLER) {
    if (YUZ_ETIKETLERI[yuz] === bolge) {
      return konfig.yuzKareAraliklari[yuz];
    }
  }

  return null;
}

export function meganeKareAraligiBolgeden(bolge: string) {
  for (const yuz of YUZLER) {
    if (YUZ_ETIKETLERI[yuz] === bolge) {
      return MEGANE_YUZ_KARE_ARALIKLARI[yuz];
    }
  }

  return null;
}

export function kareAraligiBulKareden(kare: number, konfig: Arac360Konfig) {
  return konfig.yuzKareAraliklari[yuzBulKareden(kare, konfig)];
}

export function meganeKareAraligiBulKareden(kare: number) {
  return MEGANE_YUZ_KARE_ARALIKLARI[meganeYuzBulKareden(kare)];
}

export function hasarGorunumMetaBulKareden(aci: number, konfig: Arac360Konfig) {
  const kare = acidenKareIndeks(aci, konfig.kareSayisi) + 1;
  const yuz = yuzBulKareden(kare, konfig);
  const aralik = konfig.yuzKareAraliklari[yuz];

  return {
    konum: "Araç üzerinde işaretlendi",
    gorunumBaslangicKare: aralik.baslangic,
    gorunumBitisKare: aralik.bitis,
  };
}

export function hasarMetaBulKareden(aci: number, konfig: Arac360Konfig) {
  const kare = acidenKareIndeks(aci, konfig.kareSayisi) + 1;
  const yuz = yuzBulKareden(kare, konfig);
  const aralik = konfig.yuzKareAraliklari[yuz];

  return {
    bolge: YUZ_ETIKETLERI[yuz],
    konum: "Araç üzerinde işaretlendi",
    gorunumBaslangicKare: aralik.baslangic,
    gorunumBitisKare: aralik.bitis,
  };
}

export function hasarParcaBulTiklamadan(
  yuzdeX: number,
  yuzdeY: number,
  aci: number,
  konfig: Arac360Konfig,
): KaportaParcasi {
  const kare = acidenKareIndeks(aci, konfig.kareSayisi) + 1;
  const yuz = yuzBulKareden(kare, konfig);
  return kaportaParcaBulYuzden(yuz, yuzdeX, yuzdeY);
}

export function meganeHasarMetaBulKareden(aci: number, konfig: Arac360Konfig) {
  return hasarMetaBulKareden(aci, konfig);
}

function yuzBul(yuzdeX: number, yuzdeY: number): Arac360Yuz {
  const skorOn =
    Math.max(0, 0.45 - yuzdeY) * (1 - Math.min(1, Math.abs(yuzdeX - 0.5) * 2.2));
  const skorArka =
    Math.max(0, yuzdeY - 0.55) * (1 - Math.min(1, Math.abs(yuzdeX - 0.5) * 2.2));
  const skorSol =
    Math.max(0, 0.4 - yuzdeX) * (1 - Math.min(1, Math.abs(yuzdeY - 0.5) * 1.6));
  const skorSag =
    Math.max(0, yuzdeX - 0.6) * (1 - Math.min(1, Math.abs(yuzdeY - 0.5) * 1.6));

  const adaylar: Array<{ yuz: Arac360Yuz; skor: number }> = [
    { yuz: "on", skor: skorOn },
    { yuz: "arka", skor: skorArka },
    { yuz: "sol", skor: skorSol },
    { yuz: "sag", skor: skorSag },
  ];

  adaylar.sort((a, b) => b.skor - a.skor);
  return adaylar[0]?.skor > 0.02 ? adaylar[0].yuz : "on";
}

function kareAraligiBelirle(
  yuzdeX: number,
  yuzdeY: number,
  yuzKareAraliklari: Record<Arac360Yuz, Arac360KareAraligi>,
): Arac360KareAraligi {
  return yuzKareAraliklari[yuzBul(yuzdeX, yuzdeY)];
}

export function meganeKareAraligiBelirle(
  yuzdeX: number,
  yuzdeY: number,
): Arac360KareAraligi {
  return kareAraligiBelirle(yuzdeX, yuzdeY, MEGANE_YUZ_KARE_ARALIKLARI);
}

export function meganeYuzEtiketiBul(yuzdeX: number, yuzdeY: number) {
  return YUZ_ETIKETLERI[yuzBul(yuzdeX, yuzdeY)];
}

export function meganeHasarMetaBul(yuzdeX: number, yuzdeY: number) {
  const aralik = meganeKareAraligiBelirle(yuzdeX, yuzdeY);

  return {
    bolge: meganeYuzEtiketiBul(yuzdeX, yuzdeY),
    konum: "Araç üzerinde işaretlendi",
    gorunumBaslangicKare: aralik.baslangic,
    gorunumBitisKare: aralik.bitis,
  };
}

export function kareAraligiMetni(baslangic: number, bitis: number) {
  return `foto ${baslangic}–${bitis}`;
}

export function kareAraligindaMi(
  mevcutKare: number,
  baslangic: number,
  bitis: number,
) {
  if (baslangic <= bitis) {
    return mevcutKare >= baslangic && mevcutKare <= bitis;
  }

  return mevcutKare >= baslangic || mevcutKare <= bitis;
}

export function kareAraligiGenisligi(
  baslangic: number,
  bitis: number,
  kareSayisi: number,
) {
  if (baslangic <= bitis) {
    return bitis - baslangic + 1;
  }

  return kareSayisi - baslangic + 1 + bitis;
}

export function aciFarkiHesapla(noktaAcisi: number, gorunumAcisi: number) {
  let fark = noktaAcisi - gorunumAcisi;
  fark = ((fark % 360) + 540) % 360 - 180;
  return fark;
}

const MEGANE_360: Arac360Konfig = {
  kareSayisi: 24,
  goruntuYolu: (index) =>
    `/araclar/megane/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: meganeKareAraligiBelirle,
  yuzKareAraliklari: MEGANE_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: MEGANE_YUZ_MERKEZ_KARE,
};

function audiA6KareAraligiBelirle(yuzdeX: number, yuzdeY: number) {
  return kareAraligiBelirle(yuzdeX, yuzdeY, AUDI_A6_YUZ_KARE_ARALIKLARI);
}

function audiA8LKareAraligiBelirle(yuzdeX: number, yuzdeY: number) {
  return kareAraligiBelirle(yuzdeX, yuzdeY, AUDI_A6_YUZ_KARE_ARALIKLARI);
}

const AUDI_A6_360: Arac360Konfig = {
  kareSayisi: 36,
  goruntuYolu: (index) =>
    `/araclar/audi-a6/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: audiA6KareAraligiBelirle,
  yuzKareAraliklari: AUDI_A6_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: AUDI_A6_YUZ_MERKEZ_KARE,
};

const AUDI_A8L_360: Arac360Konfig = {
  kareSayisi: 36,
  goruntuYolu: (index) =>
    `/araclar/audi-a8l/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: audiA8LKareAraligiBelirle,
  yuzKareAraliklari: AUDI_A6_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: AUDI_A6_YUZ_MERKEZ_KARE,
};

function corollaKareAraligiBelirle(yuzdeX: number, yuzdeY: number) {
  return kareAraligiBelirle(yuzdeX, yuzdeY, AUDI_A6_YUZ_KARE_ARALIKLARI);
}

const COROLLA_360: Arac360Konfig = {
  kareSayisi: 36,
  goruntuYolu: (index) =>
    `/araclar/corolla/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: corollaKareAraligiBelirle,
  yuzKareAraliklari: AUDI_A6_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: AUDI_A6_YUZ_MERKEZ_KARE,
};

const TOGG_T10X_YUZ_KARE_ARALIKLARI: Record<Arac360Yuz, Arac360KareAraligi> = {
  on: { baslangic: 17, bitis: 2 },
  sol: { baslangic: 3, bitis: 8 },
  arka: { baslangic: 9, bitis: 12 },
  sag: { baslangic: 13, bitis: 16 },
};

const TOGG_T10X_YUZ_MERKEZ_KARE: Record<Arac360Yuz, number> = {
  on: 1,
  sol: 5,
  arka: 10,
  sag: 14,
};

function toggT10XKareAraligiBelirle(yuzdeX: number, yuzdeY: number) {
  return kareAraligiBelirle(yuzdeX, yuzdeY, TOGG_T10X_YUZ_KARE_ARALIKLARI);
}

const TOGG_T10X_360: Arac360Konfig = {
  kareSayisi: 18,
  goruntuYolu: (index) =>
    `/araclar/togg-t10x/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: toggT10XKareAraligiBelirle,
  yuzKareAraliklari: TOGG_T10X_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: TOGG_T10X_YUZ_MERKEZ_KARE,
};

function toggT10FKareAraligiBelirle(yuzdeX: number, yuzdeY: number) {
  return kareAraligiBelirle(yuzdeX, yuzdeY, TOGG_T10X_YUZ_KARE_ARALIKLARI);
}

const TOGG_T10F_360: Arac360Konfig = {
  kareSayisi: 18,
  goruntuYolu: (index) =>
    `/araclar/togg-t10f/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: toggT10FKareAraligiBelirle,
  yuzKareAraliklari: TOGG_T10X_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: TOGG_T10X_YUZ_MERKEZ_KARE,
};

function superbKareAraligiBelirle(yuzdeX: number, yuzdeY: number) {
  return kareAraligiBelirle(yuzdeX, yuzdeY, AUDI_A6_YUZ_KARE_ARALIKLARI);
}

const SUPERB_360: Arac360Konfig = {
  kareSayisi: 36,
  goruntuYolu: (index) =>
    `/araclar/superb/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: superbKareAraligiBelirle,
  yuzKareAraliklari: AUDI_A6_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: AUDI_A6_YUZ_MERKEZ_KARE,
};

const TOURNEO_YUZ_KARE_ARALIKLARI: Record<Arac360Yuz, Arac360KareAraligi> = {
  on: { baslangic: 30, bitis: 4 },
  sol: { baslangic: 5, bitis: 14 },
  arka: { baslangic: 15, bitis: 21 },
  sag: { baslangic: 22, bitis: 29 },
};

const TOURNEO_YUZ_MERKEZ_KARE: Record<Arac360Yuz, number> = {
  on: 1,
  sol: 9,
  arka: 18,
  sag: 25,
};

function tourneoKareAraligiBelirle(yuzdeX: number, yuzdeY: number) {
  return kareAraligiBelirle(yuzdeX, yuzdeY, TOURNEO_YUZ_KARE_ARALIKLARI);
}

const TOURNEO_360: Arac360Konfig = {
  kareSayisi: 33,
  goruntuYolu: (index) =>
    `/araclar/tourneo/${String(index + 1).padStart(2, "0")}.png`,
  kareAraligiBelirle: tourneoKareAraligiBelirle,
  yuzKareAraliklari: TOURNEO_YUZ_KARE_ARALIKLARI,
  yuzMerkezKare: TOURNEO_YUZ_MERKEZ_KARE,
};

const MODEL_360_KONFIG: Record<string, Arac360Konfig> = {
  megane: MEGANE_360,
  "a6": AUDI_A6_360,
  "a8l": AUDI_A8L_360,
  corolla: COROLLA_360,
  t10x: TOGG_T10X_360,
  t10f: TOGG_T10F_360,
  superb: SUPERB_360,
  tourneo: TOURNEO_360,
};

function modelMetniniNormalizeEt(model: string) {
  return model.trim().toLowerCase();
}

export function meganeModeliMi(model: string) {
  return modelMetniniNormalizeEt(model).includes("megane");
}

export function audiA6ModeliMi(model: string) {
  return modelMetniniNormalizeEt(model).includes("a6");
}

export function audiA8LModeliMi(model: string) {
  const normalized = modelMetniniNormalizeEt(model).replace(/[\s-]/g, "");
  return normalized.includes("a8l") || normalized === "a8";
}

export function corollaModeliMi(model: string) {
  return modelMetniniNormalizeEt(model).includes("corolla");
}

export function toggT10XModeliMi(model: string) {
  const normalized = modelMetniniNormalizeEt(model).replace(/[\s-]/g, "");
  return normalized.includes("t10x");
}

export function toggT10FModeliMi(model: string) {
  const normalized = modelMetniniNormalizeEt(model).replace(/[\s-]/g, "");
  return normalized.includes("t10f");
}

export function superbModeliMi(model: string) {
  return modelMetniniNormalizeEt(model).includes("superb");
}

export function tourneoModeliMi(model: string) {
  return modelMetniniNormalizeEt(model).includes("tourneo");
}

export function model360KonfigBul(
  _marka: string,
  model: string,
): Arac360Konfig | null {
  const normalizedModel = modelMetniniNormalizeEt(model);

  if (meganeModeliMi(normalizedModel)) {
    return MEGANE_360;
  }

  if (corollaModeliMi(normalizedModel)) {
    return COROLLA_360;
  }

  if (toggT10FModeliMi(normalizedModel)) {
    return TOGG_T10F_360;
  }

  if (toggT10XModeliMi(normalizedModel)) {
    return TOGG_T10X_360;
  }

  if (superbModeliMi(normalizedModel)) {
    return SUPERB_360;
  }

  if (tourneoModeliMi(normalizedModel)) {
    return TOURNEO_360;
  }

  if (audiA8LModeliMi(normalizedModel)) {
    return AUDI_A8L_360;
  }

  if (audiA6ModeliMi(normalizedModel)) {
    return AUDI_A6_360;
  }

  return MODEL_360_KONFIG[normalizedModel] ?? null;
}

export function model360DestekliyorMu(marka: string, model: string) {
  return model360KonfigBul(marka, model) !== null;
}

export function acidenKareIndeks(aci: number, kareSayisi: number) {
  const normalize = ((aci % 360) + 360) % 360;
  return Math.round(normalize / (360 / kareSayisi)) % kareSayisi;
}

export function kareMerkezAcisi(indeks: number, kareSayisi: number) {
  return indeks * (360 / kareSayisi);
}

export function aciyiKareMerkezineSnapEt(aci: number, kareSayisi: number) {
  return kareMerkezAcisi(acidenKareIndeks(aci, kareSayisi), kareSayisi);
}

export function goruntuOlculeriHesapla(
  genislik: number,
  yukseklik: number,
  goruntuGenisligi: number,
  goruntuYuksekligi: number,
): AracCizimOlculeri {
  const goruntuOrani = goruntuGenisligi / goruntuYuksekligi;
  const alanOrani = genislik / yukseklik;

  let cizimGenisligi: number;
  let cizimYuksekligi: number;

  if (goruntuOrani > alanOrani) {
    cizimGenisligi = genislik * 0.94;
    cizimYuksekligi = cizimGenisligi / goruntuOrani;
  } else {
    cizimYuksekligi = yukseklik * 0.9;
    cizimGenisligi = cizimYuksekligi * goruntuOrani;
  }

  const cizimX = (genislik - cizimGenisligi) / 2;
  const cizimY = (yukseklik - cizimYuksekligi) / 2 + yukseklik * 0.02;

  const yanBosluk = cizimGenisligi * 0.06;
  const ustBosluk = cizimYuksekligi * 0.1;
  const altBosluk = cizimYuksekligi * 0.06;

  return {
    merkezX: genislik / 2,
    zeminY: cizimY + cizimYuksekligi - altBosluk,
    govdeX: cizimX + yanBosluk,
    govdeY: cizimY + cizimYuksekligi * 0.42,
    govdeGenisligi: cizimGenisligi - yanBosluk * 2,
    govdeYuksekligi: cizimYuksekligi - ustBosluk - altBosluk,
  };
}

export function goruntu360Ciz(
  ctx: CanvasRenderingContext2D,
  genislik: number,
  yukseklik: number,
  goruntu: HTMLImageElement,
): AracCizimOlculeri | null {
  if (!goruntu?.naturalWidth || !goruntu.naturalHeight) {
    return null;
  }

  ctx.clearRect(0, 0, genislik, yukseklik);

  const arkaPlan = ctx.createLinearGradient(0, 0, 0, yukseklik);
  arkaPlan.addColorStop(0, "#1e293b");
  arkaPlan.addColorStop(0.55, "#0f172a");
  arkaPlan.addColorStop(1, "#020617");
  ctx.fillStyle = arkaPlan;
  ctx.fillRect(0, 0, genislik, yukseklik);

  const olculer = goruntuOlculeriHesapla(
    genislik,
    yukseklik,
    goruntu.naturalWidth,
    goruntu.naturalHeight,
  );

  const goruntuOrani = goruntu.naturalWidth / goruntu.naturalHeight;
  const alanOrani = genislik / yukseklik;

  let cizimGenisligi: number;
  let cizimYuksekligi: number;

  if (goruntuOrani > alanOrani) {
    cizimGenisligi = genislik * 0.94;
    cizimYuksekligi = cizimGenisligi / goruntuOrani;
  } else {
    cizimYuksekligi = yukseklik * 0.9;
    cizimGenisligi = cizimYuksekligi * goruntuOrani;
  }

  const cizimX = (genislik - cizimGenisligi) / 2;
  const cizimY = (yukseklik - cizimYuksekligi) / 2 + yukseklik * 0.02;

  ctx.drawImage(goruntu, cizimX, cizimY, cizimGenisligi, cizimYuksekligi);

  return olculer;
}

export async function arac360GoruntuleriYukle(konfig: Arac360Konfig) {
  const yuklemeler = Array.from({ length: konfig.kareSayisi }, (_, index) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error(`360° görseli yüklenemedi: ${index + 1}`));
      img.src = konfig.goruntuYolu(index);
    });
  });

  return Promise.all(yuklemeler);
}
