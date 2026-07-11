"use client";

import type { CSSProperties } from "react";
import styles from "@/app/components/kaporta-semasi.module.css";
import {
  hasarlariKaportaSemasinaAyir,
  KAPORTA_ORIJINAL_RENK,
  KAPORTA_SEMA_HASAR_TURLERI,
  KAPORTA_SEMA_RENKLERI,
  kaportaParcaBul,
  kaportaParcaEtiketi,
  oncelikliKaportaHasarTuru,
  type KaportaParcasi,
  type KaportaSemaHasarTuru,
} from "@/app/lib/hasar-bolgeleri";
import {
  HASAR_TURU_ETIKETLERI,
  type AracHasari,
} from "@/app/lib/arac-hasarlari";

type KaportaSemasiProps = {
  hasarlar: AracHasari[];
  seciliHasarId?: number | null;
};

const PARCA_SINIFLARI: Record<KaportaParcasi, string> = {
  on_tampon: styles.onTampon,
  kaput: styles.kaput,
  tavan: styles.tavan,
  bagaj: styles.bagaj,
  arka_tampon: styles.arkaTampon,
  sol_on_camurluk: styles.solOnCamurluk,
  sol_on_kapi: styles.solOnKapi,
  sol_arka_kapi: styles.solArkaKapi,
  sol_arka_camurluk: styles.solArkaCamurluk,
  sag_on_camurluk: styles.sagOnCamurluk,
  sag_on_kapi: styles.sagOnKapi,
  sag_arka_kapi: styles.sagArkaKapi,
  sag_arka_camurluk: styles.sagArkaCamurluk,
};

const PARCA_SIRASI: KaportaParcasi[] = [
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

const LEGEND: Array<{ tur: KaportaSemaHasarTuru | "orijinal"; etiket: string }> =
  [
    { tur: "orijinal", etiket: "Orijinal" },
    { tur: "degisen", etiket: HASAR_TURU_ETIKETLERI.degisen },
    { tur: "boya", etiket: HASAR_TURU_ETIKETLERI.boya },
    { tur: "lokal_boyali", etiket: HASAR_TURU_ETIKETLERI.lokal_boyali },
    { tur: "gocuk", etiket: HASAR_TURU_ETIKETLERI.gocuk },
    { tur: "cizik", etiket: HASAR_TURU_ETIKETLERI.cizik },
  ];

function legendRengi(tur: KaportaSemaHasarTuru | "orijinal") {
  if (tur === "orijinal") return KAPORTA_ORIJINAL_RENK;
  return KAPORTA_SEMA_RENKLERI[tur];
}

function parcaVurguluMu(
  parca: KaportaParcasi,
  seciliHasarId: number | null | undefined,
  hasarHaritasi: Map<KaportaParcasi, AracHasari[]>,
) {
  if (seciliHasarId == null) return false;
  const parcaHasarlari = hasarHaritasi.get(parca) ?? [];
  return parcaHasarlari.some((hasar) => hasar.id === seciliHasarId);
}

export default function KaportaSemasi({
  hasarlar,
  seciliHasarId = null,
}: KaportaSemasiProps) {
  const hasarHaritasi = hasarlariKaportaSemasinaAyir(hasarlar);
  const semadaGosterilen = KAPORTA_SEMA_HASAR_TURLERI.map(
    (tur) => HASAR_TURU_ETIKETLERI[tur],
  ).join(", ");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h5 className={styles.headerTitle}>Kaporta şeması</h5>
        <p className={styles.headerHint}>
          Yalnızca {semadaGosterilen} kayıtları gösterilir. Kaza kayıtları şemada
          renklendirilmez.
        </p>
      </div>

      <div className={styles.legend}>
        {LEGEND.map((oge) => (
          <span key={oge.tur} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ backgroundColor: legendRengi(oge.tur) }}
            />
            {oge.etiket}
          </span>
        ))}
      </div>

      <div className={styles.diagramWrap}>
        <div className={styles.carParts} role="img" aria-label="Araç kaporta şeması">
          {PARCA_SIRASI.map((parca) => {
            const parcaHasarlari = hasarHaritasi.get(parca) ?? [];
            const hasarTuru = oncelikliKaportaHasarTuru(parcaHasarlari);
            const vurgulu = parcaVurguluMu(parca, seciliHasarId, hasarHaritasi);

            return (
              <div
                key={parca}
                className={`${styles.part} ${PARCA_SINIFLARI[parca]} ${
                  hasarTuru ? styles.partHasar : ""
                } ${vurgulu ? styles.partVurgulu : ""}`}
                style={
                  hasarTuru
                    ? ({
                        ["--part-color" as string]:
                          KAPORTA_SEMA_RENKLERI[hasarTuru],
                      } as CSSProperties)
                    : undefined
                }
                title={kaportaParcaEtiketi(parca)}
                aria-label={kaportaParcaEtiketi(parca)}
              >
                {hasarTuru ? (
                  <div className={styles.partTint} aria-hidden="true" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function bolgedenKaportaParca(deger: string) {
  return kaportaParcaBul(deger);
}
