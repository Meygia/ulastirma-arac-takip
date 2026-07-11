"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  aracEkle,
  aracGuncelle,
  aracSil,
  araclariYonetimIcinGetir,
} from "@/app/actions/arac-yonetim-actions";
import {
  baslikFormatla,
  markaEtiketi,
  SIRALI_TANIMLI_MARKALAR,
} from "@/app/lib/arac-grupla";
import {
  ARAC_DURUM_ETIKETLERI,
  ARAC_DURUMLARI,
  aracDurumuSinifi,
} from "@/app/lib/arac-durumu";
import {
  araciDuzenleFormunaDonustur,
  bosAracEkleFormu,
  markaModelleriBul,
  type AracDuzenleFormVerisi,
  type AracEkleFormVerisi,
  type AracYonetimKaydi,
} from "@/app/lib/arac-yonetim";

type FormModu = "kapali" | "yeni" | "duzenle";

const inputSinifi =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100";

export default function AracYonetimPanel() {
  const router = useRouter();
  const [araclar, setAraclar] = useState<AracYonetimKaydi[]>([]);
  const [formModu, setFormModu] = useState<FormModu>("kapali");
  const [yeniForm, setYeniForm] = useState<AracEkleFormVerisi>(bosAracEkleFormu());
  const [duzenleForm, setDuzenleForm] = useState<AracDuzenleFormVerisi | null>(
    null,
  );
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();

  function listeyiYenile() {
    baslat(async () => {
      const kayitlar = await araclariYonetimIcinGetir();
      setAraclar(kayitlar);
    });
  }

  useEffect(() => {
    listeyiYenile();
  }, []);

  function sayfayiYenile() {
    router.refresh();
    listeyiYenile();
  }

  function yeniFormAc() {
    setYeniForm(bosAracEkleFormu());
    setFormModu("yeni");
    setDuzenleForm(null);
    setDuzenlenenId(null);
    setHata("");
  }

  function duzenlemeAc(arac: AracYonetimKaydi) {
    setDuzenleForm(araciDuzenleFormunaDonustur(arac));
    setDuzenlenenId(arac.id);
    setFormModu("duzenle");
    setHata("");
  }

  function formuKapat() {
    setFormModu("kapali");
    setDuzenleForm(null);
    setDuzenlenenId(null);
    setHata("");
  }

  function yeniAracKaydet() {
    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        await aracEkle(yeniForm);
        setFormModu("kapali");
        setMesaj("Araç eklendi.");
        sayfayiYenile();
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Araç eklenemedi.",
        );
      }
    });
  }

  function duzenlemeyiKaydet() {
    if (!duzenleForm || !duzenlenenId) return;

    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        await aracGuncelle(duzenlenenId, duzenleForm);
        setFormModu("kapali");
        setDuzenlenenId(null);
        setDuzenleForm(null);
        setMesaj("Araç bilgileri güncellendi.");
        sayfayiYenile();
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Güncelleme başarısız.",
        );
      }
    });
  }

  function araciSilOnay(arac: AracYonetimKaydi) {
    if (
      !window.confirm(
        `${arac.plaka} plakalı aracı filodan çıkarmak istiyor musunuz? Hasar kayıtları da silinir.`,
      )
    ) {
      return;
    }

    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        await aracSil(arac.id);
        if (duzenlenenId === arac.id) {
          formuKapat();
        }
        setMesaj("Araç filodan çıkarıldı.");
        sayfayiYenile();
      } catch (error) {
        setHata(error instanceof Error ? error.message : "Silme başarısız.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg text-zinc-100">Araç yönetimi</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Araç ekleme, çıkarma, plaka ve zimmet düzenleme
          </p>
        </div>
        <button
          type="button"
          onClick={yeniFormAc}
          className="rounded-full bg-emerald-600 px-4 py-2 text-xs text-white hover:bg-emerald-500"
        >
          Yeni araç ekle
        </button>
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

      {formModu === "yeni" ? (
        <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <h3 className="text-sm text-zinc-100">Yeni araç kaydı</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Plaka</span>
              <input
                value={yeniForm.plaka}
                onChange={(e) =>
                  setYeniForm((f) => ({ ...f, plaka: e.target.value }))
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Marka</span>
              <select
                value={yeniForm.marka}
                onChange={(e) => {
                  const marka = e.target.value;
                  const modeller = markaModelleriBul(marka);
                  setYeniForm((f) => ({
                    ...f,
                    marka,
                    model: modeller.includes(f.model)
                      ? f.model
                      : (modeller[0] ?? f.model),
                  }));
                }}
                className={inputSinifi}
              >
                {SIRALI_TANIMLI_MARKALAR.map((marka) => (
                  <option key={marka} value={marka}>
                    {markaEtiketi(marka)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Model</span>
              <input
                value={yeniForm.model}
                list="yeni-arac-modelleri"
                onChange={(e) =>
                  setYeniForm((f) => ({ ...f, model: e.target.value }))
                }
                className={inputSinifi}
                placeholder="ör. megane"
              />
              <datalist id="yeni-arac-modelleri">
                {markaModelleriBul(yeniForm.marka).map((model) => (
                  <option key={model} value={model} />
                ))}
              </datalist>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Yıl</span>
              <input
                type="number"
                value={yeniForm.yil}
                onChange={(e) =>
                  setYeniForm((f) => ({ ...f, yil: e.target.value }))
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Şasi no</span>
              <input
                value={yeniForm.sasiNo}
                onChange={(e) =>
                  setYeniForm((f) => ({ ...f, sasiNo: e.target.value }))
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Zimmetli kişi</span>
              <input
                value={yeniForm.atananKisi}
                onChange={(e) =>
                  setYeniForm((f) => ({ ...f, atananKisi: e.target.value }))
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Zimmetli telefon</span>
              <input
                value={yeniForm.atananKisiTelefon}
                onChange={(e) =>
                  setYeniForm((f) => ({
                    ...f,
                    atananKisiTelefon: e.target.value,
                  }))
                }
                placeholder="0 (5xx) xxx xx xx"
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Durum</span>
              <select
                value={yeniForm.durum}
                onChange={(e) =>
                  setYeniForm((f) => ({
                    ...f,
                    durum: e.target.value as typeof yeniForm.durum,
                  }))
                }
                className={inputSinifi}
              >
                {ARAC_DURUMLARI.map((durum) => (
                  <option key={durum} value={durum}>
                    {ARAC_DURUM_ETIKETLERI[durum]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Kilometre</span>
              <input
                type="number"
                min={0}
                value={yeniForm.kilometre}
                onChange={(e) =>
                  setYeniForm((f) => ({ ...f, kilometre: e.target.value }))
                }
                className={inputSinifi}
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={bekliyor}
              onClick={yeniAracKaydet}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
            >
              {bekliyor ? "Kaydediliyor..." : "Kaydet"}
            </button>
            <button
              type="button"
              onClick={formuKapat}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
            >
              İptal
            </button>
          </div>
        </div>
      ) : null}

      {formModu === "duzenle" && duzenleForm ? (
        <div className="mt-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <h3 className="text-sm text-zinc-100">Araç düzenle</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Plaka</span>
              <input
                value={duzenleForm.plaka}
                onChange={(e) =>
                  setDuzenleForm((f) =>
                    f ? { ...f, plaka: e.target.value } : f,
                  )
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Marka</span>
              <select
                value={duzenleForm.marka}
                onChange={(e) =>
                  setDuzenleForm((f) =>
                    f ? { ...f, marka: e.target.value } : f,
                  )
                }
                className={inputSinifi}
              >
                {SIRALI_TANIMLI_MARKALAR.map((marka) => (
                  <option key={marka} value={marka}>
                    {markaEtiketi(marka)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Model</span>
              <input
                value={duzenleForm.model}
                list="duzenle-arac-modelleri"
                onChange={(e) =>
                  setDuzenleForm((f) =>
                    f ? { ...f, model: e.target.value } : f,
                  )
                }
                className={inputSinifi}
                placeholder="ör. megane"
              />
              <datalist id="duzenle-arac-modelleri">
                {markaModelleriBul(duzenleForm.marka).map((model) => (
                  <option key={model} value={model} />
                ))}
              </datalist>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Yıl</span>
              <input
                type="number"
                value={duzenleForm.yil}
                onChange={(e) =>
                  setDuzenleForm((f) => (f ? { ...f, yil: e.target.value } : f))
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Şasi no</span>
              <input
                value={duzenleForm.sasiNo}
                onChange={(e) =>
                  setDuzenleForm((f) =>
                    f ? { ...f, sasiNo: e.target.value } : f,
                  )
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Zimmetli kişi</span>
              <input
                value={duzenleForm.atananKisi}
                onChange={(e) =>
                  setDuzenleForm((f) =>
                    f ? { ...f, atananKisi: e.target.value } : f,
                  )
                }
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Zimmetli telefon</span>
              <input
                value={duzenleForm.atananKisiTelefon}
                onChange={(e) =>
                  setDuzenleForm((f) =>
                    f ? { ...f, atananKisiTelefon: e.target.value } : f,
                  )
                }
                placeholder="0 (5xx) xxx xx xx"
                className={inputSinifi}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-500">Durum</span>
              <select
                value={duzenleForm.durum}
                onChange={(e) =>
                  setDuzenleForm((f) =>
                    f
                      ? {
                          ...f,
                          durum: e.target.value as typeof f.durum,
                        }
                      : f,
                  )
                }
                className={inputSinifi}
              >
                {ARAC_DURUMLARI.map((durum) => (
                  <option key={durum} value={durum}>
                    {ARAC_DURUM_ETIKETLERI[durum]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={bekliyor}
              onClick={duzenlemeyiKaydet}
              className="rounded-lg bg-zinc-100 px-4 py-2 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
            >
              {bekliyor ? "Kaydediliyor..." : "Güncelle"}
            </button>
            <button
              type="button"
              onClick={formuKapat}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
            >
              İptal
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto">
        {araclar.length === 0 ? (
          <p className="text-sm text-zinc-500">Kayıtlı araç bulunmuyor.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="pb-2 pr-3 font-normal">Plaka</th>
                <th className="pb-2 pr-3 font-normal">Araç</th>
                <th className="pb-2 pr-3 font-normal">Zimmetli kişi</th>
                <th className="pb-2 pr-3 font-normal">Durum</th>
                <th className="pb-2 font-normal">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {araclar.map((arac) => (
                <tr
                  key={arac.id}
                  className="border-b border-zinc-800/80 last:border-0"
                >
                  <td className="py-3 pr-3 text-zinc-100">{arac.plaka}</td>
                  <td className="py-3 pr-3 text-zinc-400">
                    {markaEtiketi(arac.marka)} {baslikFormatla(arac.model)} ·{" "}
                    {arac.yil}
                  </td>
                  <td className="py-3 pr-3 text-zinc-300">
                    <span className="block">{arac.atananKisi ?? "—"}</span>
                    {arac.atananKisiTelefon ? (
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {arac.atananKisiTelefon}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs ring-1 ${aracDurumuSinifi(arac.durum)}`}
                    >
                      {ARAC_DURUM_ETIKETLERI[arac.durum]}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => duzenlemeAc(arac)}
                        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 ring-1 ring-zinc-700 hover:bg-zinc-700"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={bekliyor}
                        onClick={() => araciSilOnay(arac)}
                        className="rounded-lg bg-red-950 px-3 py-1.5 text-xs text-red-400 ring-1 ring-red-900 hover:bg-red-900/50"
                      >
                        Çıkar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
