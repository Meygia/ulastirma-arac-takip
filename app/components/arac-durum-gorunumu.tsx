"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { hasarEkle } from "@/app/actions/hasar-actions";
import AracBilgiSekmeleri from "@/app/components/arac-bilgi-sekmeleri";
import AracBelgeleriPanel from "@/app/components/arac-belgeleri-panel";
import AracOzellikleri from "@/app/components/arac-ozellikleri";
import HasarGecmisiPanel from "@/app/components/hasar-gecmisi-panel";
import { aracCiz, aracRenkBul, type AracCizimOlculeri } from "@/app/lib/arac-cizim";
import {
  acidenKareIndeks,
  aciyiKareMerkezineSnapEt,
  arac360GoruntuleriYukle,
  goruntu360Ciz,
  hasarGorunumMetaBulKareden,
  hasarParcaBulTiklamadan,
  model360KonfigBul,
} from "@/app/lib/arac-360";
import {
  KAPORTA_PARCALARI,
  kaportaParcaBul,
  kaportaParcaEtiketi,
  bolgeDepolamaDegeri,
  bolgeGosterimMetni,
  type KaportaParcasi,
} from "@/app/lib/hasar-bolgeleri";
import {
  bosHasarFormu,
  HASAR_TURU_ETIKETLERI,
  HASAR_TURU_RENKLERI,
  HASAR_TURLERI,
  hasarGorunurMu,
  hasarIsaretiYakinMi,
  hasarKonumuHesapla,
  isaretAlaniIcerisindeMi,
  pikseliYuzdeye,
  tarihFormatla,
  type AracHasari,
  type HasarFormVerisi,
  type HasarTuru,
} from "@/app/lib/arac-hasarlari";
import {
  hasarIsaretSimgesiCiz,
  hasarLegendSimgesiCiz,
  hasarOnizlemeSimgesiCiz,
} from "@/app/lib/hasar-isaret-simgeleri";
import { baslikFormatla, markaEtiketi } from "@/app/lib/arac-grupla";

type AracDurumGorunumuProps = {
  aracId: number;
  plaka: string;
  marka: string;
  model: string;
  yil: number;
  sasiNo: string | null;
  aktifGorevdeMi: boolean;
  bakimdaMi: boolean;
  atananKisi: string | null;
  atananKisiTelefon: string | null;
};

type HasarIsareti = AracHasari & {
  x: number;
  y: number;
  gorunur: boolean;
};

type IsaretPopup = {
  x: number;
  y: number;
  form: HasarFormVerisi;
};

function HasarSimgeMini({ tur }: { tur: HasarTuru }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 20, 20);
    hasarLegendSimgesiCiz(ctx, 10, 10, tur, HASAR_TURU_RENKLERI[tur]);
  }, [tur]);

  return (
    <canvas
      ref={canvasRef}
      width={20}
      height={20}
      className="shrink-0"
      aria-hidden
    />
  );
}

function hasarIsaretiCiz(
  ctx: CanvasRenderingContext2D,
  hasar: HasarIsareti,
  secili: boolean,
  vurgulu: boolean,
) {
  hasarIsaretSimgesiCiz(
    ctx,
    hasar.x,
    hasar.y,
    hasar.tur,
    HASAR_TURU_RENKLERI[hasar.tur],
    secili,
    vurgulu,
  );
}

export default function AracDurumGorunumu({
  aracId,
  plaka,
  marka,
  model,
  yil,
  sasiNo,
  aktifGorevdeMi,
  bakimdaMi,
  atananKisi,
  atananKisiTelefon,
}: AracDurumGorunumuProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const olculerRef = useRef<AracCizimOlculeri | null>(null);
  const gorunurIsaretlerRef = useRef<HasarIsareti[]>([]);
  const surukleniyorRef = useRef(false);
  const sonXRef = useRef(0);
  const baslangicNoktasiRef = useRef({ x: 0, y: 0 });
  const [aci, setAci] = useState(25);
  const [surukleniyor, setSurukleniyor] = useState(false);
  const [isaretlemeModu, setIsaretlemeModu] = useState(false);
  const [seciliHasarId, setSeciliHasarId] = useState<number | null>(null);
  const [hasarlar, setHasarlar] = useState<AracHasari[]>([]);
  const [yenilemeAnahtari, setYenilemeAnahtari] = useState(0);
  const [isaretPopup, setIsaretPopup] = useState<IsaretPopup | null>(null);
  const [hoverHasar, setHoverHasar] = useState<HasarIsareti | null>(null);
  const [popupHata, setPopupHata] = useState("");
  const [bekliyor, baslat] = useTransition();
  const [goruntuler360, setGoruntuler360] = useState<HTMLImageElement[] | null>(
    null,
  );
  const [goruntuYukleniyor, setGoruntuYukleniyor] = useState(false);

  const konfig360 = model360KonfigBul(marka, model);
  const konfig360Anahtari = konfig360
    ? `${marka}|${model}|${konfig360.goruntuYolu(0)}`
    : null;
  const kareSayisi360 = konfig360?.kareSayisi;
  const kareAraligiBelirle = konfig360?.kareAraligiBelirle;
  const renk = aracRenkBul(marka, model);

  useEffect(() => {
    if (!konfig360) {
      setGoruntuler360(null);
      setGoruntuYukleniyor(false);
      return;
    }

    let iptal = false;
    setGoruntuYukleniyor(true);
    setGoruntuler360(null);

    arac360GoruntuleriYukle(konfig360)
      .then((goruntuler) => {
        if (!iptal) {
          setGoruntuler360(goruntuler);
        }
      })
      .catch(() => {
        if (!iptal) {
          setGoruntuler360(null);
        }
      })
      .finally(() => {
        if (!iptal) {
          setGoruntuYukleniyor(false);
        }
      });

    return () => {
      iptal = true;
    };
  }, [konfig360, konfig360Anahtari]);

  useEffect(() => {
    setSeciliHasarId(null);
    setIsaretPopup(null);
    setHoverHasar(null);
    setIsaretlemeModu(false);
  }, [aracId]);

  const ciz = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const genislik = container.clientWidth;
    const yukseklik = Math.max(360, container.clientHeight);
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = genislik * pixelRatio;
    canvas.height = yukseklik * pixelRatio;
    canvas.style.width = `${genislik}px`;
    canvas.style.height = `${yukseklik}px`;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    let olculer: AracCizimOlculeri | null = null;

    if (konfig360) {
      const goruntulerHazir =
        goruntuler360 !== null &&
        goruntuler360.length === konfig360.kareSayisi;
      const kareIndeks = acidenKareIndeks(aci, konfig360.kareSayisi);
      const goruntu = goruntulerHazir ? goruntuler360[kareIndeks] : undefined;

      if (goruntu?.naturalWidth) {
        olculer = goruntu360Ciz(ctx, genislik, yukseklik, goruntu);
      } else {
        ctx.clearRect(0, 0, genislik, yukseklik);
        const arkaPlan = ctx.createLinearGradient(0, 0, 0, yukseklik);
        arkaPlan.addColorStop(0, "#1e293b");
        arkaPlan.addColorStop(0.55, "#0f172a");
        arkaPlan.addColorStop(1, "#020617");
        ctx.fillStyle = arkaPlan;
        ctx.fillRect(0, 0, genislik, yukseklik);
      }
    } else {
      olculer = aracCiz(ctx, genislik, yukseklik, aci, renk);
    }

    olculerRef.current = olculer;

    if (!olculer) {
      return;
    }

    const isaretler = hasarlar
      .map((hasar) => {
        const gorunur = hasarGorunurMu(
          hasar,
          aci,
          kareSayisi360,
          kareAraligiBelirle,
          konfig360,
        );
        const konum = hasarKonumuHesapla(hasar, olculer);

        return { ...hasar, ...konum, gorunur };
      })
      .filter((hasar) => hasar.gorunur);

    gorunurIsaretlerRef.current = isaretler;

    for (const hasar of isaretler) {
      hasarIsaretiCiz(
        ctx,
        hasar,
        hasar.id === seciliHasarId,
        hasar.id === hoverHasar?.id,
      );
    }

    if (isaretPopup) {
      hasarOnizlemeSimgesiCiz(
        ctx,
        isaretPopup.x,
        isaretPopup.y,
        isaretPopup.form.tur,
        HASAR_TURU_RENKLERI[isaretPopup.form.tur],
      );
    }
  }, [
    aci,
    goruntuler360,
    hasarlar,
    hoverHasar?.id,
    isaretPopup,
    konfig360,
    kareAraligiBelirle,
    kareSayisi360,
    renk,
    seciliHasarId,
  ]);

  useEffect(() => {
    ciz();
  }, [ciz]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const gozlemci = new ResizeObserver(() => ciz());
    gozlemci.observe(container);

    return () => gozlemci.disconnect();
  }, [ciz]);

  function yerelKoordinat(clientX: number, clientY: number) {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function suruklemeBaslat(clientX: number, clientY: number) {
    surukleniyorRef.current = true;
    setSurukleniyor(true);
    sonXRef.current = clientX;
    baslangicNoktasiRef.current = { x: clientX, y: clientY };
  }

  function suruklemeSur(clientX: number) {
    if (!surukleniyorRef.current || isaretlemeModu) return;

    const fark = clientX - sonXRef.current;
    sonXRef.current = clientX;
    setAci((onceki) => onceki + fark * 0.55);
  }

  function suruklemeBitir() {
    surukleniyorRef.current = false;
    setSurukleniyor(false);

    if (kareSayisi360) {
      setAci((onceki) => aciyiKareMerkezineSnapEt(onceki, kareSayisi360));
    }
  }

  function hoverHasarBul(x: number, y: number) {
    for (const hasar of gorunurIsaretlerRef.current) {
      if (hasarIsaretiYakinMi(x, y, hasar.x, hasar.y)) {
        return hasar;
      }
    }

    return null;
  }

  function isaretlemePopupAc(clientX: number, clientY: number) {
    if (konfig360 && !goruntuler360) return;

    const olculer = olculerRef.current;
    const konum = yerelKoordinat(clientX, clientY);

    if (!olculer || !konum) return;

    if (!isaretAlaniIcerisindeMi(konum.x, konum.y, olculer)) return;

    const { yuzdeX, yuzdeY } = pikseliYuzdeye(konum.x, konum.y, olculer);
    const gorunumMeta = konfig360
      ? hasarGorunumMetaBulKareden(aci, konfig360)
      : null;
    const parca = konfig360
      ? hasarParcaBulTiklamadan(yuzdeX, yuzdeY, aci, konfig360)
      : null;

    setIsaretPopup({
      x: konum.x,
      y: konum.y,
      form: {
        ...bosHasarFormu(aci),
        yuzdeX,
        yuzdeY,
        gorunumAcisi: aci,
        gorunumBaslangicKare: gorunumMeta?.gorunumBaslangicKare ?? null,
        gorunumBitisKare: gorunumMeta?.gorunumBitisKare ?? null,
        bolge: parca ?? "",
        konum: gorunumMeta?.konum ?? "Araç üzerinde işaretlendi",
      },
    });
    setPopupHata("");
    setHoverHasar(null);
  }

  function popupKaydet() {
    if (!isaretPopup) return;

    setPopupHata("");

    const gorunumMeta = konfig360
      ? hasarGorunumMetaBulKareden(isaretPopup.form.gorunumAcisi, konfig360)
      : null;

    const kayitFormu = {
      ...isaretPopup.form,
      ...(gorunumMeta ?? {}),
      bolge: bolgeDepolamaDegeri(isaretPopup.form.bolge.trim()),
      aciklama: isaretPopup.form.aciklama.trim() || (gorunumMeta ? "—" : ""),
    };

    baslat(async () => {
      try {
        const yeniHasar = await hasarEkle(aracId, kayitFormu);
        setHasarlar((onceki) => [yeniHasar, ...onceki]);
        setIsaretPopup(null);
        setIsaretlemeModu(false);
        setHoverHasar(null);
        setYenilemeAnahtari((onceki) => onceki + 1);
      } catch (error) {
        setPopupHata(
          error instanceof Error ? error.message : "Kayıt işlemi başarısız.",
        );
      }
    });
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    baslangicNoktasiRef.current = { x: event.clientX, y: event.clientY };

    if (isaretlemeModu) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    suruklemeBaslat(event.clientX, event.clientY);
    setHoverHasar(null);
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const konum = yerelKoordinat(event.clientX, event.clientY);

    if (isaretlemeModu) {
      if (konum) {
        setHoverHasar(hoverHasarBul(konum.x, konum.y));
      }
      return;
    }

    if (surukleniyorRef.current) {
      suruklemeSur(event.clientX);
      setHoverHasar(null);
      return;
    }

    if (konum) {
      setHoverHasar(hoverHasarBul(konum.x, konum.y));
    }
  }

  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const hareket =
      Math.abs(event.clientX - baslangicNoktasiRef.current.x) +
      Math.abs(event.clientY - baslangicNoktasiRef.current.y);

    if (isaretlemeModu && hareket < 8) {
      isaretlemePopupAc(event.clientX, event.clientY);
      suruklemeBitir();
      return;
    }

    suruklemeBitir();
  }

  function hasarSec(hasar: AracHasari) {
    setSeciliHasarId(hasar.id);
    setAci(
      kareSayisi360
        ? aciyiKareMerkezineSnapEt(hasar.gorunumAcisi, kareSayisi360)
        : hasar.gorunumAcisi,
    );
  }

  const gorunurHasarSayisi = hasarlar.filter((hasar) =>
    hasarGorunurMu(hasar, aci, kareSayisi360, kareAraligiBelirle, konfig360),
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Canlı durum görünümü
            </p>
            <h3 className="text-lg text-zinc-100">
              {markaEtiketi(marka)} {baslikFormatla(model)} · {plaka}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400 ring-1 ring-zinc-700">
              {gorunurHasarSayisi} hasar görünür
            </span>
            <button
              type="button"
              disabled={Boolean(konfig360 && goruntuYukleniyor)}
              onClick={() => {
                setIsaretlemeModu((onceki) => !onceki);
                setIsaretPopup(null);
                setHoverHasar(null);
              }}
              className={`rounded-full px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                isaretlemeModu
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-700"
              }`}
            >
              {isaretlemeModu ? "İşaretleme açık" : "Hasar işaretle"}
            </button>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-900">
              360°
            </span>
            <AracOzellikleri
              plaka={plaka}
              marka={marka}
              model={model}
              yil={yil}
              sasiNo={sasiNo}
              aktifGorevdeMi={aktifGorevdeMi}
              bakimdaMi={bakimdaMi}
              atananKisi={atananKisi}
              atananKisiTelefon={atananKisiTelefon}
            />
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative h-[380px] w-full touch-none select-none md:h-[440px] ${
            isaretlemeModu
              ? "cursor-crosshair"
              : hoverHasar
                ? "cursor-pointer"
                : surukleniyor
                  ? "cursor-grabbing"
                  : "cursor-grab"
          }`}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerLeave={() => {
            suruklemeBitir();
            setHoverHasar(null);
          }}
          onPointerCancel={suruklemeBitir}
        >
          <canvas ref={canvasRef} className="h-full w-full" />

          {konfig360 && goruntuYukleniyor ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-950/40 text-sm text-zinc-400">
              360° görseller yükleniyor...
            </div>
          ) : null}

          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg border border-zinc-700/80 bg-zinc-950/90 px-3 py-2 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">
              Hasar türleri
            </p>
            <ul className="mt-1.5 space-y-1">
              {(Object.keys(HASAR_TURU_ETIKETLERI) as Array<
                keyof typeof HASAR_TURU_ETIKETLERI
              >).map((tur) => (
                <li
                  key={tur}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-300"
                >
                  <HasarSimgeMini tur={tur} />
                  {HASAR_TURU_ETIKETLERI[tur]}
                </li>
              ))}
            </ul>
          </div>

          {hoverHasar && !isaretPopup ? (
            <div
              className="pointer-events-none absolute z-20 max-w-[220px] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl"
              style={{ left: hoverHasar.x, top: hoverHasar.y }}
            >
              <div
                className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-zinc-700 bg-zinc-900"
                aria-hidden
              />
              <p
                className="text-xs font-medium"
                style={{ color: HASAR_TURU_RENKLERI[hoverHasar.tur] }}
              >
                {HASAR_TURU_ETIKETLERI[hoverHasar.tur]}
              </p>
              <p className="mt-1 text-xs text-zinc-400">{bolgeGosterimMetni(hoverHasar.bolge)}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {hoverHasar.aciklama !== "—" ? hoverHasar.aciklama : ""}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {tarihFormatla(hoverHasar.tarih)}
              </p>
            </div>
          ) : null}

          {isaretPopup ? (
            <div
              className="absolute z-30 w-[min(280px,calc(100%-24px))] -translate-x-1/2 -translate-y-[calc(100%+14px)] rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-xl"
              style={{ left: isaretPopup.x, top: isaretPopup.y }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div
                className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-zinc-700 bg-zinc-900"
                aria-hidden
              />
              <p className="text-sm text-zinc-100">Yeni hasar işareti</p>
              <div className="mt-3 space-y-2">
                <label className="grid gap-1 text-xs">
                  <span className="text-zinc-500">Kaporta parçası</span>
                  <select
                    value={kaportaParcaBul(isaretPopup.form.bolge) ?? ""}
                    onChange={(event) => {
                      const parca = event.target.value as KaportaParcasi;
                      setIsaretPopup((onceki) =>
                        onceki
                          ? {
                              ...onceki,
                              form: {
                                ...onceki.form,
                                bolge: parca,
                              },
                            }
                          : onceki,
                      );
                    }}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    <option value="">Parça seçin</option>
                    {KAPORTA_PARCALARI.map((parca) => (
                      <option key={parca} value={parca}>
                        {kaportaParcaEtiketi(parca)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="text-zinc-500">Hasar türü</span>
                  <select
                    value={isaretPopup.form.tur}
                    onChange={(event) =>
                      setIsaretPopup((onceki) =>
                        onceki
                          ? {
                              ...onceki,
                              form: {
                                ...onceki.form,
                                tur: event.target.value as HasarTuru,
                              },
                            }
                          : onceki,
                      )
                    }
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
                  >
                    {HASAR_TURLERI.map((tur) => (
                      <option key={tur} value={tur}>
                        {HASAR_TURU_ETIKETLERI[tur]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs">
                  <span className="text-zinc-500">Açıklama (isteğe bağlı)</span>
                  <textarea
                    rows={2}
                    value={isaretPopup.form.aciklama}
                    onChange={(event) =>
                      setIsaretPopup((onceki) =>
                        onceki
                          ? {
                              ...onceki,
                              form: {
                                ...onceki.form,
                                aciklama: event.target.value,
                              },
                            }
                          : onceki,
                      )
                    }
                    placeholder="Ne oldu?"
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100"
                  />
                </label>
              </div>
              {popupHata ? (
                <p className="mt-2 text-xs text-red-400">{popupHata}</p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={bekliyor}
                  onClick={popupKaydet}
                  className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
                >
                  {bekliyor ? "Kaydediliyor..." : "Kaydet"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsaretPopup(null)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t border-zinc-800 bg-zinc-950/80 px-4 py-2 text-center text-xs text-zinc-500">
          {isaretlemeModu
            ? kareAraligiBelirle
              ? "Hasarlı yere tıklayın; aracı çevirerek işaretleri görüntüleyin"
              : "Aracın üzerine tıklayın; işaretin üzerine gelince detayları görün"
            : "Aracı sürükleyerek çevirin; hasar işaretleri ilgili açılarda görünür"}
        </div>
      </div>

      <AracBilgiSekmeleri aracId={aracId} />

      <AracBelgeleriPanel aracId={aracId} />

      <HasarGecmisiPanel
        aracId={aracId}
        aci={aci}
        kareSayisi360={kareSayisi360}
        kareAraligiBelirle={kareAraligiBelirle}
        konfig360={konfig360}
        seciliHasarId={seciliHasarId}
        onHasarSec={hasarSec}
        onHasarlarDegisti={setHasarlar}
        yenilemeAnahtari={yenilemeAnahtari}
      />
    </div>
  );
}
