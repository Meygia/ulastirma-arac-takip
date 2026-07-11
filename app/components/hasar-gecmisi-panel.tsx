"use client";

import { useEffect, useState, useTransition } from "react";
import {
  hasarEkle,
  hasarGuncelle,
  hasarSil,
  hasarlariGetir,
} from "@/app/actions/hasar-actions";
import type { Arac360KareAraligi, Arac360Konfig } from "@/app/lib/arac-360";
import { hasarGorunumMetaBulKareden } from "@/app/lib/arac-360";
import KaportaSemasi from "@/app/components/kaporta-semasi";
import {
  KAPORTA_PARCALARI,
  kaportaParcaBul,
  kaportaParcaEtiketi,
  bolgeGosterimMetni,
  bolgeDepolamaDegeri,
  type KaportaParcasi,
} from "@/app/lib/hasar-bolgeleri";
import {
  bosHasarFormu,
  HASAR_TURU_ETIKETLERI,
  HASAR_TURU_RENKLERI,
  HASAR_TURLERI,
  hasarGorunurMu,
  hasariFormaDonustur,
  tarihFormatla,
  type AracHasari,
  type HasarFormVerisi,
} from "@/app/lib/arac-hasarlari";

type HasarGecmisiPanelProps = {
  aracId: number;
  aci: number;
  kareSayisi360?: number;
  kareAraligiBelirle?: (
    yuzdeX: number,
    yuzdeY: number,
  ) => Arac360KareAraligi;
  konfig360?: Arac360Konfig | null;
  seciliHasarId: number | null;
  onHasarSec: (hasar: AracHasari) => void;
  onHasarlarDegisti: (hasarlar: AracHasari[]) => void;
  disardanForm?: HasarFormVerisi | null;
  onDisardanFormKullanildi?: () => void;
  yenilemeAnahtari?: number;
};

type FormModu = "kapali" | "yeni" | "duzenle";

export default function HasarGecmisiPanel({
  aracId,
  aci,
  kareSayisi360,
  kareAraligiBelirle,
  konfig360,
  seciliHasarId,
  onHasarSec,
  onHasarlarDegisti,
  disardanForm,
  onDisardanFormKullanildi,
  yenilemeAnahtari = 0,
}: HasarGecmisiPanelProps) {
  const [hasarlar, setHasarlar] = useState<AracHasari[]>([]);
  const [formModu, setFormModu] = useState<FormModu>("kapali");
  const [form, setForm] = useState<HasarFormVerisi>(bosHasarFormu());
  const [duzenlenenHasarId, setDuzenlenenHasarId] = useState<number | null>(
    null,
  );
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();

  useEffect(() => {
    let iptal = false;

    async function hasarlariYukle() {
      try {
        const kayitlar = await hasarlariGetir(aracId);
        if (iptal) return;
        setHasarlar(kayitlar);
        onHasarlarDegisti(kayitlar);
      } catch (error) {
        if (!iptal) {
          setHata(
            error instanceof Error
              ? error.message
              : "Hasar kayıtları yüklenemedi.",
          );
        }
      }
    }

    void hasarlariYukle();

    return () => {
      iptal = true;
    };
  }, [aracId, yenilemeAnahtari]);

  useEffect(() => {
    if (!disardanForm) return;

    setForm(disardanForm);
    setFormModu("yeni");
    setDuzenlenenHasarId(null);
    setHata("");
    onDisardanFormKullanildi?.();
  }, [disardanForm, onDisardanFormKullanildi]);

  function hasarlariGuncelle(kayitlar: AracHasari[]) {
    setHasarlar(kayitlar);
    onHasarlarDegisti(kayitlar);
  }

  function yeniHasarFormuAc() {
    setForm(bosHasarFormu(aci));
    setFormModu("yeni");
    setDuzenlenenHasarId(null);
    setHata("");
  }

  function hasariDuzenle(hasar: AracHasari) {
    const formVerisi = hasariFormaDonustur(hasar);

    if (konfig360 && kareSayisi360) {
      Object.assign(formVerisi, hasarGorunumMetaBulKareden(hasar.gorunumAcisi, konfig360));
    }

    setForm(formVerisi);
    setFormModu("duzenle");
    setDuzenlenenHasarId(hasar.id);
    onHasarSec(hasar);
    setHata("");
  }

  function formuIptalEt() {
    setFormModu("kapali");
    setDuzenlenenHasarId(null);
    setHata("");
  }

  function formKaydet() {
    setHata("");
    setMesaj("");

    const gorunumMeta =
      konfig360 && kareSayisi360
        ? hasarGorunumMetaBulKareden(form.gorunumAcisi, konfig360)
        : null;

    const kaydedilecekForm = {
      ...form,
      ...(gorunumMeta ?? {}),
      bolge: bolgeDepolamaDegeri(form.bolge.trim()),
      aciklama: form.aciklama.trim() || (gorunumMeta ? "—" : form.aciklama),
    };

    baslat(async () => {
      try {
        if (formModu === "yeni") {
          const yeni = await hasarEkle(aracId, kaydedilecekForm);
          const guncel = await hasarlariGetir(aracId);
          hasarlariGuncelle(guncel);
          onHasarSec(yeni);
          setFormModu("kapali");
          setMesaj("Hasar kaydı eklendi.");
          return;
        }

        if (formModu === "duzenle" && duzenlenenHasarId) {
          const guncellenen = await hasarGuncelle(
            duzenlenenHasarId,
            kaydedilecekForm,
          );
          const guncel = await hasarlariGetir(aracId);
          hasarlariGuncelle(guncel);
          onHasarSec(guncellenen);
          setFormModu("kapali");
          setDuzenlenenHasarId(null);
          setMesaj("Hasar kaydı güncellendi.");
        }
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Kayıt işlemi başarısız.",
        );
      }
    });
  }

  function hasariSilOnay(hasarId: number) {
    if (!window.confirm("Bu hasar kaydını silmek istiyor musunuz?")) {
      return;
    }

    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        await hasarSil(hasarId);
        const guncel = await hasarlariGetir(aracId);
        hasarlariGuncelle(guncel);
        setFormModu("kapali");
        setDuzenlenenHasarId(null);
        setMesaj("Hasar kaydı silindi.");
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Silme işlemi başarısız.",
        );
      }
    });
  }

  const seciliParca = kaportaParcaBul(form.bolge);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm text-zinc-100">Hasar geçmişi</h4>
        {!kareAraligiBelirle ? (
          <button
            type="button"
            onClick={yeniHasarFormuAc}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700"
          >
            Yeni hasar ekle
          </button>
        ) : null}
      </div>

      {mesaj ? (
        <p className="mt-3 rounded-lg bg-emerald-950/50 px-3 py-2 text-sm text-emerald-400">
          {mesaj}
        </p>
      ) : null}
      {hata ? (
        <p className="mt-3 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
          {hata}
        </p>
      ) : null}

      {formModu !== "kapali" ? (
        <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <h5 className="text-sm text-zinc-100">
            {formModu === "yeni" ? "Yeni hasar kaydı" : "Hasar kaydını düzenle"}
          </h5>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Hasar türü</span>
              <select
                value={form.tur}
                onChange={(event) =>
                  setForm((onceki) => ({
                    ...onceki,
                    tur: event.target.value as HasarFormVerisi["tur"],
                  }))
                }
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
              >
                {HASAR_TURLERI.map((tur) => (
                  <option key={tur} value={tur}>
                    {HASAR_TURU_ETIKETLERI[tur]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Tarih</span>
              <input
                type="date"
                value={form.tarih}
                onChange={(event) =>
                  setForm((onceki) => ({
                    ...onceki,
                    tarih: event.target.value,
                  }))
                }
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Kaporta parçası</span>
              <select
                value={seciliParca ?? ""}
                onChange={(event) => {
                  const parca = event.target.value as KaportaParcasi;
                  setForm((onceki) => ({
                    ...onceki,
                    bolge: parca,
                  }));
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
              >
                <option value="">Parça seçin</option>
                {KAPORTA_PARCALARI.map((parca) => (
                  <option key={parca} value={parca}>
                    {kaportaParcaEtiketi(parca)}
                  </option>
                ))}
              </select>
            </label>
            {!kareAraligiBelirle ? (
              <>
                <label className="grid gap-1 text-sm md:col-span-2">
                  <span className="text-zinc-500">Konum</span>
                  <input
                    value={form.konum}
                    onChange={(event) =>
                      setForm((onceki) => ({
                        ...onceki,
                        konum: event.target.value,
                      }))
                    }
                    placeholder="Kızılay, Ankara"
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
                  />
                </label>
              </>
            ) : null}
            <label className="md:col-span-2 grid gap-1 text-sm">
              <span className="text-zinc-500">
                Açıklama{kareAraligiBelirle ? " (isteğe bağlı)" : ""}
              </span>
              <textarea
                value={form.aciklama}
                onChange={(event) =>
                  setForm((onceki) => ({
                    ...onceki,
                    aciklama: event.target.value,
                  }))
                }
                rows={3}
                placeholder="Hasar detayı"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100"
              />
            </label>
            {!kareSayisi360 ? (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="text-zinc-500">
                    Görünüm açısı ({Math.round(form.gorunumAcisi)}°)
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={359}
                    value={form.gorunumAcisi}
                    onChange={(event) =>
                      setForm((onceki) => ({
                        ...onceki,
                        gorunumAcisi: Number(event.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-zinc-500">
                    Görünürlük toleransı ({Math.round(form.gorunumToleransi)}°)
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={form.gorunumToleransi}
                    onChange={(event) =>
                      setForm((onceki) => ({
                        ...onceki,
                        gorunumToleransi: Number(event.target.value),
                      }))
                    }
                    className="w-full"
                  />
                </label>
              </>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setForm((onceki) => ({ ...onceki, gorunumAcisi: aci }))
              }
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
            >
              Mevcut açıyı kullan
            </button>
            <button
              type="button"
              disabled={bekliyor}
              onClick={formKaydet}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
            >
              {bekliyor ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={formuIptalEt}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
            >
              İptal
            </button>
          </div>
        </div>
      ) : null}

      {hasarlar.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">
          Bu araç için kayıtlı hasar bulunmuyor.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {hasarlar.map((hasar) => {
            const aktif = seciliHasarId === hasar.id;
            const gorunur = hasarGorunurMu(
              hasar,
              aci,
              kareSayisi360,
              kareAraligiBelirle,
              konfig360,
            );

            return (
              <div
                key={hasar.id}
                className={`rounded-xl border px-4 py-3 transition-colors ${
                  aktif
                    ? "border-zinc-100 bg-zinc-100 text-zinc-900"
                    : "border-zinc-700 bg-zinc-800 text-zinc-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onHasarSec(hasar)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="inline-flex items-center gap-2 text-sm"
                      style={{
                        color: aktif
                          ? HASAR_TURU_RENKLERI[hasar.tur]
                          : HASAR_TURU_RENKLERI[hasar.tur],
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: HASAR_TURU_RENKLERI[hasar.tur],
                        }}
                      />
                      {HASAR_TURU_ETIKETLERI[hasar.tur]}
                    </span>
                    <span
                      className={`text-xs ${aktif ? "text-zinc-600" : "text-zinc-500"}`}
                    >
                      {gorunur ? "Görünür" : "Döndürün"}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-sm ${aktif ? "text-zinc-700" : "text-zinc-400"}`}
                  >
                    {bolgeGosterimMetni(hasar.bolge)}
                    {hasar.aciklama && hasar.aciklama !== "—"
                      ? ` · ${hasar.aciklama}`
                      : ""}
                  </p>
                  <p
                    className={`mt-2 text-xs ${aktif ? "text-zinc-400" : "text-zinc-500"}`}
                  >
                    {hasar.konum} · {tarihFormatla(hasar.tarih)}
                  </p>
                </button>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => hasariDuzenle(hasar)}
                    className={`rounded-lg px-3 py-1.5 text-xs ${
                      aktif
                        ? "bg-zinc-900 text-zinc-100 hover:bg-zinc-800"
                        : "bg-zinc-700 text-zinc-200 ring-1 ring-zinc-600 hover:bg-zinc-600"
                    }`}
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    disabled={bekliyor}
                    onClick={() => hasariSilOnay(hasar.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs ${
                      aktif
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-red-950 text-red-400 ring-1 ring-red-900 hover:bg-red-900/50"
                    }`}
                  >
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <KaportaSemasi hasarlar={hasarlar} seciliHasarId={seciliHasarId} />
    </section>
  );
}
