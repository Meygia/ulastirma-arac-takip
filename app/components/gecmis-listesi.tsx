"use client";

import { useState, useTransition } from "react";
import {
  aracBilgiGecmisiGuncelle,
  aracBilgiGecmisiSil,
} from "@/app/actions/arac-bilgi-actions";
import {
  bosGecmisFormu,
  gecmisKaydiniFormaDonustur,
  gecmisKaydiOzeti,
  type AracBilgiGecmisiKaydi,
  type GecmisFormVerisi,
} from "@/app/lib/arac-bilgi-gecmisi";
import { LASTIK_TURU_ETIKETLERI } from "@/app/lib/arac-lastik";
import { kisaTarihFormatla } from "@/app/lib/arac-parcalari";

const inputSinifi =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100";

type GecmisListesiProps = {
  aracId: number;
  kayitlar: AracBilgiGecmisiKaydi[];
  yukleniyor: boolean;
  onYenile: () => void;
  onGecmisSilindi: (kayit: AracBilgiGecmisiKaydi) => void;
  baslik?: string;
  bosMesaj?: string;
  herZamanGoster?: boolean;
};

function GecmisDuzenleFormu({
  kayit,
  form,
  onFormDegisti,
}: {
  kayit: AracBilgiGecmisiKaydi;
  form: GecmisFormVerisi;
  onFormDegisti: (form: GecmisFormVerisi) => void;
}) {
  if (kayit.tur === "kilometre") {
    return (
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          <span className="text-zinc-500">Tarih</span>
          <input
            type="date"
            value={form.tarih}
            onChange={(event) =>
              onFormDegisti({ ...form, tarih: event.target.value })
            }
            className={inputSinifi}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-zinc-500">Kilometre</span>
          <input
            type="number"
            min={0}
            value={form.kilometre}
            onChange={(event) =>
              onFormDegisti({ ...form, kilometre: event.target.value })
            }
            className={inputSinifi}
          />
        </label>
      </div>
    );
  }

  if (kayit.tur === "lastik") {
    return (
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="grid gap-1 text-xs">
          <span className="text-zinc-500">Lastik türü</span>
          <select
            value={form.lastikTuru}
            onChange={(event) =>
              onFormDegisti({
                ...form,
                lastikTuru: event.target.value as GecmisFormVerisi["lastikTuru"],
              })
            }
            className={inputSinifi}
          >
            <option value="">Seçin</option>
            <option value="kislik">{LASTIK_TURU_ETIKETLERI.kislik}</option>
            <option value="yazlik">{LASTIK_TURU_ETIKETLERI.yazlik}</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-zinc-500">Değişim tarihi</span>
          <input
            type="date"
            value={form.tarih}
            onChange={(event) =>
              onFormDegisti({ ...form, tarih: event.target.value })
            }
            className={inputSinifi}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-zinc-500">Değişim yeri</span>
          <input
            value={form.servisAdi}
            onChange={(event) =>
              onFormDegisti({ ...form, servisAdi: event.target.value })
            }
            className={inputSinifi}
          />
        </label>
        <label className="grid gap-1 text-xs">
          <span className="text-zinc-500">Muhafaza yeri</span>
          <input
            value={form.aciklama}
            onChange={(event) =>
              onFormDegisti({ ...form, aciklama: event.target.value })
            }
            className={inputSinifi}
          />
        </label>
      </div>
    );
  }

  const aciklamaEtiketi = kayit.tur === "bakim" ? "Yapılan işler" : "Notlar";

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <label className="grid gap-1 text-xs">
        <span className="text-zinc-500">Tarih</span>
        <input
          type="date"
          value={form.tarih}
          onChange={(event) =>
            onFormDegisti({ ...form, tarih: event.target.value })
          }
          className={inputSinifi}
        />
      </label>
      <label className="grid gap-1 text-xs">
        <span className="text-zinc-500">Kilometre</span>
        <input
          type="number"
          min={0}
          value={form.kilometre}
          onChange={(event) =>
            onFormDegisti({ ...form, kilometre: event.target.value })
          }
          className={inputSinifi}
        />
      </label>
      <label className="grid gap-1 text-xs sm:col-span-2">
        <span className="text-zinc-500">Servis</span>
        <input
          value={form.servisAdi}
          onChange={(event) =>
            onFormDegisti({ ...form, servisAdi: event.target.value })
          }
          className={inputSinifi}
        />
      </label>
      <label className="grid gap-1 text-xs sm:col-span-2">
        <span className="text-zinc-500">{aciklamaEtiketi}</span>
        <textarea
          rows={2}
          value={form.aciklama}
          onChange={(event) =>
            onFormDegisti({ ...form, aciklama: event.target.value })
          }
          className={inputSinifi}
        />
      </label>
    </div>
  );
}

export default function GecmisListesi({
  aracId,
  kayitlar,
  yukleniyor,
  onYenile,
  onGecmisSilindi,
  baslik = "Geçmiş kayıtlar",
  bosMesaj = "Henüz kayıt yok.",
  herZamanGoster = false,
}: GecmisListesiProps) {
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);
  const [form, setForm] = useState(bosGecmisFormu());
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();

  if (yukleniyor) {
    return (
      <p className="text-xs text-zinc-500">{baslik} yükleniyor...</p>
    );
  }

  if (kayitlar.length === 0 && !herZamanGoster) {
    return null;
  }

  function duzenlemeyeGec(kayit: AracBilgiGecmisiKaydi) {
    setDuzenlenenId(kayit.id);
    setForm(gecmisKaydiniFormaDonustur(kayit));
    setHata("");
  }

  function duzenlemeyiIptalEt() {
    setDuzenlenenId(null);
    setForm(bosGecmisFormu());
    setHata("");
  }

  function kaydet(kayit: AracBilgiGecmisiKaydi) {
    setHata("");
    baslat(async () => {
      try {
        await aracBilgiGecmisiGuncelle(kayit.id, aracId, {
          tarih: form.tarih,
          kilometre: form.kilometre,
          servisAdi: form.servisAdi,
          aciklama: form.aciklama,
          lastikTuru: form.lastikTuru,
        });
        duzenlemeyiIptalEt();
        onYenile();
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Güncelleme başarısız.",
        );
      }
    });
  }

  function sil(kayit: AracBilgiGecmisiKaydi) {
    setHata("");
    baslat(async () => {
      try {
        const silinen = await aracBilgiGecmisiSil(kayit.id, aracId);
        if (duzenlenenId === kayit.id) {
          duzenlemeyiIptalEt();
        }
        onYenile();
        onGecmisSilindi(silinen);
      } catch (error) {
        setHata(error instanceof Error ? error.message : "Silme başarısız.");
      }
    });
  }

  return (
    <div className={herZamanGoster ? "" : "mt-5 border-t border-zinc-800 pt-4"}>
      <h5 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {baslik}
      </h5>
      {hata ? <p className="mt-2 text-xs text-red-400">{hata}</p> : null}
      {kayitlar.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          {bosMesaj}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {kayitlar.map((kayit) => (
            <li
              key={kayit.id}
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5"
            >
              {duzenlenenId === kayit.id ? (
                <>
                  <GecmisDuzenleFormu
                    kayit={kayit}
                    form={form}
                    onFormDegisti={setForm}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={bekliyor}
                      onClick={duzenlemeyiIptalEt}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
                    >
                      İptal
                    </button>
                    <button
                      type="button"
                      disabled={bekliyor}
                      onClick={() => kaydet(kayit)}
                      className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
                    >
                      {bekliyor ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-200">{gecmisKaydiOzeti(kayit)}</p>
                  {kayit.tarih ? (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Tarih: {kisaTarihFormatla(kayit.tarih)}
                    </p>
                  ) : kayit.tur === "kilometre" ? (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Kayıt: {kisaTarihFormatla(kayit.kayitTarihi)}
                    </p>
                  ) : null}
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={bekliyor}
                      onClick={() => sil(kayit)}
                      className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/70 disabled:opacity-60"
                    >
                      Sil
                    </button>
                    <button
                      type="button"
                      disabled={bekliyor}
                      onClick={() => duzenlemeyeGec(kayit)}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-60"
                    >
                      Düzenle
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
