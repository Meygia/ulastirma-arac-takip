import {
  acidenKareIndeks,
  kareAraligindaMi,
  kareAraligiBolgeden,
  kareAraligiBulKareden,
  type Arac360KareAraligi,
  type Arac360Konfig,
} from "@/app/lib/arac-360";
import { bolgeDepolamaDegeri } from "@/app/lib/hasar-bolgeleri";

export type HasarTuru =
  | "kaza"
  | "cizik"
  | "gocuk"
  | "boya"
  | "degisen"
  | "lokal_boyali";

export type AracHasari = {
  id: number;
  aracId: number;
  tur: HasarTuru;
  bolge: string;
  konum: string;
  tarih: string;
  aciklama: string;
  gorunumAcisi: number;
  gorunumToleransi: number;
  gorunumBaslangicKare: number | null;
  gorunumBitisKare: number | null;
  yuzdeX: number;
  yuzdeY: number;
};

export type HasarFormVerisi = {
  tur: HasarTuru;
  bolge: string;
  konum: string;
  tarih: string;
  aciklama: string;
  gorunumAcisi: number;
  gorunumToleransi: number;
  gorunumBaslangicKare: number | null;
  gorunumBitisKare: number | null;
  yuzdeX: number;
  yuzdeY: number;
};

export const HASAR_TURU_ETIKETLERI: Record<HasarTuru, string> = {
  kaza: "Kaza",
  cizik: "Çizik",
  gocuk: "Göçük",
  boya: "Boya hasarı",
  degisen: "Değişen",
  lokal_boyali: "Lokal boyalı",
};

export const HASAR_TURU_RENKLERI: Record<HasarTuru, string> = {
  kaza: "#DC2626",
  cizik: "#F59E0B",
  gocuk: "#7C3AED",
  boya: "#2563EB",
  degisen: "#059669",
  lokal_boyali: "#0891B2",
};

export const HASAR_TURLERI = Object.keys(HASAR_TURU_ETIKETLERI) as HasarTuru[];

export function hasarTuruGecerliMi(value: string): value is HasarTuru {
  return HASAR_TURLERI.includes(value as HasarTuru);
}

export function acidenKareNumarasi(aci: number, kareSayisi: number) {
  return acidenKareIndeks(aci, kareSayisi) + 1;
}

export function hasarGorunurMu(
  hasar: AracHasari,
  aci: number,
  kareSayisi?: number,
  kareAraligiBelirle?: (
    yuzdeX: number,
    yuzdeY: number,
  ) => Arac360KareAraligi,
  konfig360?: Arac360Konfig | null,
) {
  if (kareSayisi && kareSayisi > 0 && konfig360) {
    const mevcutKare = acidenKareNumarasi(aci, kareSayisi);
    const aralik =
      kareAraligiBolgeden(hasar.bolge, konfig360) ??
      kareAraligiBulKareden(
        acidenKareIndeks(hasar.gorunumAcisi, kareSayisi) + 1,
        konfig360,
      );

    return kareAraligindaMi(mevcutKare, aralik.baslangic, aralik.bitis);
  }

  const fark = Math.abs(
    ((hasar.gorunumAcisi - aci + 540) % 360) - 180,
  );

  return fark <= hasar.gorunumToleransi;
}

export function hasarKonumuHesapla(
  hasar: AracHasari,
  olculer: {
    govdeX: number;
    govdeY: number;
    govdeGenisligi: number;
    govdeYuksekligi: number;
    merkezX: number;
  },
) {
  const isaretAlaniUst = olculer.govdeY - 55;
  const isaretAlaniYuksekligi = olculer.govdeYuksekligi + 90;

  return {
    x:
      olculer.govdeX +
      olculer.govdeGenisligi * 0.03 +
      olculer.govdeGenisligi * 0.94 * hasar.yuzdeX,
    y: isaretAlaniUst + isaretAlaniYuksekligi * hasar.yuzdeY,
  };
}

export function isaretAlaniIcerisindeMi(
  x: number,
  y: number,
  olculer: {
    govdeX: number;
    govdeY: number;
    govdeGenisligi: number;
    govdeYuksekligi: number;
  },
) {
  const isaretAlaniUst = olculer.govdeY - 55;
  const isaretAlaniAlt = olculer.govdeY + olculer.govdeYuksekligi + 35;
  const isaretAlaniSol = olculer.govdeX + olculer.govdeGenisligi * 0.03;
  const isaretAlaniSag = olculer.govdeX + olculer.govdeGenisligi * 0.97;

  return (
    x >= isaretAlaniSol &&
    x <= isaretAlaniSag &&
    y >= isaretAlaniUst &&
    y <= isaretAlaniAlt
  );
}

export function hasarIsaretiYakinMi(
  x: number,
  y: number,
  isaretX: number,
  isaretY: number,
  yaricap = 22,
) {
  const dx = x - isaretX;
  const dy = y - isaretY;
  return dx * dx + dy * dy <= yaricap * yaricap;
}

export function pikseliYuzdeye(
  x: number,
  y: number,
  olculer: {
    govdeX: number;
    govdeY: number;
    govdeGenisligi: number;
    govdeYuksekligi: number;
  },
) {
  const isaretAlaniUst = olculer.govdeY - 55;
  const isaretAlaniYuksekligi = olculer.govdeYuksekligi + 90;
  const isaretAlaniSol = olculer.govdeX + olculer.govdeGenisligi * 0.03;
  const isaretAlaniGenisligi = olculer.govdeGenisligi * 0.94;

  return {
    yuzdeX: Math.min(
      1,
      Math.max(0, (x - isaretAlaniSol) / isaretAlaniGenisligi),
    ),
    yuzdeY: Math.min(
      1,
      Math.max(0, (y - isaretAlaniUst) / isaretAlaniYuksekligi),
    ),
  };
}

export function tarihFormatla(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function bosHasarFormu(aci = 0): HasarFormVerisi {
  return {
    tur: "cizik",
    bolge: "",
    konum: "",
    tarih: new Date().toISOString().slice(0, 10),
    aciklama: "",
    gorunumAcisi: aci,
    gorunumToleransi: 40,
    gorunumBaslangicKare: null,
    gorunumBitisKare: null,
    yuzdeX: 0.5,
    yuzdeY: 0.5,
  };
}

export function hasariFormaDonustur(hasar: AracHasari): HasarFormVerisi {
  return {
    tur: hasar.tur,
    bolge: bolgeDepolamaDegeri(hasar.bolge),
    konum: hasar.konum,
    tarih: hasar.tarih.slice(0, 10),
    aciklama: hasar.aciklama,
    gorunumAcisi: hasar.gorunumAcisi,
    gorunumToleransi: hasar.gorunumToleransi,
    gorunumBaslangicKare: hasar.gorunumBaslangicKare,
    gorunumBitisKare: hasar.gorunumBitisKare,
    yuzdeX: hasar.yuzdeX,
    yuzdeY: hasar.yuzdeY,
  };
}
