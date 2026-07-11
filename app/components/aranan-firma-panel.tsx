"use client";

import { useEffect, useState, useTransition } from "react";
import {
  aracFirmaGeriYukle,
  aracFirmaGuncelle,
  aracFirmaKaydiEkle,
  aracFirmaSil,
  aracFirmalariniGetir,
} from "@/app/actions/arac-bilgi-actions";
import {
  GeriAlBildirimi,
  useGeriAl,
} from "@/app/components/geri-al-bildirimi";
import {
  ARAC_FIRMA_ETIKETLERI,
  bosFirmaFormu,
  firmaKaydiOzeti,
  type AracFirmaKaydi,
  type AracFirmaTuru,
} from "@/app/lib/arac-firma";
import { kisaTarihFormatla } from "@/app/lib/arac-parcalari";

const inputSinifi =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100";

type PanelModu = "liste" | "form";

type FirmaGeriAlKaydi = {
  kayit: AracFirmaKaydi;
  etiket: string;
};

type ArananFirmaPanelProps = {
  aracId: number;
  tur: AracFirmaTuru;
};

function FirmaKayitListesi({
  aracId,
  kayitlar,
  yukleniyor,
  onYenile,
  onSilindi,
}: {
  aracId: number;
  kayitlar: AracFirmaKaydi[];
  yukleniyor: boolean;
  onYenile: () => void;
  onSilindi: (kayit: AracFirmaKaydi) => void;
}) {
  const [duzenlenenId, setDuzenlenenId] = useState<number | null>(null);
  const [form, setForm] = useState(bosFirmaFormu());
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();

  if (yukleniyor) {
    return <p className="mt-3 text-xs text-zinc-500">Kayıtlar yükleniyor...</p>;
  }

  function duzenlemeyeGec(kayit: AracFirmaKaydi) {
    setDuzenlenenId(kayit.id);
    setForm({
      firmaAdi: kayit.firmaAdi ?? "",
      telefon: kayit.telefon ?? "",
    });
    setHata("");
  }

  function duzenlemeyiIptalEt() {
    setDuzenlenenId(null);
    setForm(bosFirmaFormu());
    setHata("");
  }

  function kaydet(kayit: AracFirmaKaydi) {
    setHata("");
    baslat(async () => {
      try {
        await aracFirmaGuncelle(kayit.id, aracId, form);
        duzenlemeyiIptalEt();
        onYenile();
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Güncelleme başarısız.",
        );
      }
    });
  }

  function sil(kayit: AracFirmaKaydi) {
    setHata("");
    baslat(async () => {
      try {
        const silinen = await aracFirmaSil(kayit.id, aracId);
        if (duzenlenenId === kayit.id) {
          duzenlemeyiIptalEt();
        }
        onYenile();
        onSilindi(silinen);
      } catch (error) {
        setHata(error instanceof Error ? error.message : "Silme başarısız.");
      }
    });
  }

  return (
    <div className="mt-4">
      <h6 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        Kayıtlar
      </h6>
      {hata ? <p className="mt-2 text-xs text-red-400">{hata}</p> : null}
      {kayitlar.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-500">
          Henüz firma kaydı yok.
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
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs">
                      <span className="text-zinc-500">Firma adı</span>
                      <input
                        value={form.firmaAdi}
                        onChange={(event) =>
                          setForm((onceki) => ({
                            ...onceki,
                            firmaAdi: event.target.value,
                          }))
                        }
                        className={inputSinifi}
                      />
                    </label>
                    <label className="grid gap-1 text-xs">
                      <span className="text-zinc-500">Telefon</span>
                      <input
                        value={form.telefon}
                        onChange={(event) =>
                          setForm((onceki) => ({
                            ...onceki,
                            telefon: event.target.value,
                          }))
                        }
                        className={inputSinifi}
                      />
                    </label>
                  </div>
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
                  <p className="text-sm text-zinc-200">{firmaKaydiOzeti(kayit)}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Kayıt: {kisaTarihFormatla(kayit.kayitTarihi)}
                  </p>
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

export default function ArananFirmaPanel({ aracId, tur }: ArananFirmaPanelProps) {
  const [mod, setMod] = useState<PanelModu>("liste");
  const [form, setForm] = useState(bosFirmaFormu());
  const [kayitlar, setKayitlar] = useState<AracFirmaKaydi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [bekliyor, baslat] = useTransition();
  const {
    geriAlKaydi,
    geriAlKalan,
    goster: geriAlGoster,
    temizle: geriAlTemizle,
  } = useGeriAl<FirmaGeriAlKaydi>();

  const etiket = ARAC_FIRMA_ETIKETLERI[tur];

  async function listeyiYenile() {
    setYukleniyor(true);
    setHata("");
    try {
      const kayitlar = await aracFirmalariniGetir(aracId, tur);
      setKayitlar(kayitlar);
    } catch (error) {
      setKayitlar([]);
      setHata(
        error instanceof Error ? error.message : "Firma kayıtları yüklenemedi.",
      );
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    let iptal = false;

    async function yukle() {
      await listeyiYenile();
      if (!iptal) {
        setMod("liste");
        setForm(bosFirmaFormu());
      }
    }

    void yukle();

    return () => {
      iptal = true;
    };
  }, [aracId, tur]);

  function eklemeyeGec() {
    setForm(bosFirmaFormu());
    setMod("form");
    setMesaj("");
    setHata("");
  }

  function formuIptalEt() {
    setForm(bosFirmaFormu());
    setMod("liste");
    setHata("");
  }

  function kaydet() {
    setMesaj("");
    setHata("");

    baslat(async () => {
      try {
        await aracFirmaKaydiEkle(aracId, tur, form);
        await listeyiYenile();
        setMod("liste");
        setForm(bosFirmaFormu());
        setMesaj("Firma kaydı eklendi.");
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Kayıt işlemi başarısız.",
        );
      }
    });
  }

  function kayitSilindi(kayit: AracFirmaKaydi) {
    geriAlGoster({
      kayit,
      etiket: "Firma kaydı",
    });
  }

  function geriAl() {
    if (!geriAlKaydi) return;

    const kayit = geriAlKaydi;
    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        await aracFirmaGeriYukle(kayit.kayit);
        await listeyiYenile();
        geriAlTemizle();
        setMesaj(`${kayit.etiket} geri yüklendi.`);
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Geri alma başarısız.",
        );
      }
    });
  }

  return (
    <>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h5 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              {etiket}
            </h5>
            <p className="mt-1 text-[11px] text-zinc-500">
              Sadece bu araca özel firmalar listelenir.
            </p>
          </div>
          {mod === "liste" ? (
            <button
              type="button"
              onClick={eklemeyeGec}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
            >
              + Firma ekle
            </button>
          ) : null}
        </div>

        {mod === "form" ? (
          <>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Firma adı</span>
                <input
                  value={form.firmaAdi}
                  onChange={(event) =>
                    setForm((onceki) => ({
                      ...onceki,
                      firmaAdi: event.target.value,
                    }))
                  }
                  placeholder="Firma adı"
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Telefon</span>
                <input
                  value={form.telefon}
                  onChange={(event) =>
                    setForm((onceki) => ({
                      ...onceki,
                      telefon: event.target.value,
                    }))
                  }
                  placeholder="0 (5xx) xxx xx xx"
                  className={inputSinifi}
                />
              </label>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                disabled={bekliyor}
                onClick={formuIptalEt}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={bekliyor}
                onClick={kaydet}
                className="rounded-lg bg-zinc-100 px-4 py-2 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
              >
                {bekliyor ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </>
        ) : null}

        {mesaj ? (
          <p className="mt-3 text-xs text-emerald-400">{mesaj}</p>
        ) : null}
        {hata ? <p className="mt-3 text-xs text-red-400">{hata}</p> : null}

        <FirmaKayitListesi
          aracId={aracId}
          kayitlar={kayitlar}
          yukleniyor={yukleniyor}
          onYenile={listeyiYenile}
          onSilindi={kayitSilindi}
        />
      </div>

      {geriAlKaydi ? (
        <GeriAlBildirimi
          etiket={geriAlKaydi.etiket}
          kalan={geriAlKalan}
          bekliyor={bekliyor}
          onGeriAl={geriAl}
        />
      ) : null}
    </>
  );
}
