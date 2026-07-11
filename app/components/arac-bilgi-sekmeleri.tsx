"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import {
  aracBakimGuncelle,
  aracBilgiGecmisiGeriYukle,
  aracBilgiGecmisiniGetir,
  aracBilgiGecmisSayilariniGetir,
  aracDetayGetir,
  aracKilometreGuncelle,
  aracLastikGuncelle,
  aracParcaGuncelle,
} from "@/app/actions/arac-bilgi-actions";
import ArananFirmaPanel from "@/app/components/aranan-firma-panel";
import GecmisListesi from "@/app/components/gecmis-listesi";
import {
  GeriAlBildirimi,
  useGeriAl,
} from "@/app/components/geri-al-bildirimi";
import type { AracDetay } from "@/app/lib/arac-detay";
import {
  bakimFormaDonustur,
  bosBakimFormu,
  gecmisKaydiOzeti,
  type AracBilgiGecmisiKaydi,
  type AracBilgiGecmisiTuru,
  type BakimFormVerisi,
} from "@/app/lib/arac-bilgi-gecmisi";
import {
  bosLastikFormu,
  lastikFormaDonustur,
  LASTIK_TURU_ETIKETLERI,
  type LastikFormVerisi,
} from "@/app/lib/arac-lastik";
import {
  ARAC_PARCA_ETIKETLERI,
  ARAC_PARCA_KATEGORILERI,
  bosParcaFormu,
  kisaTarihFormatla,
  parcayiFormaDonustur,
  type AracParcaFormVerisi,
  type AracParcaKategorisi,
} from "@/app/lib/arac-parcalari";

type AracBilgiSekmeleriProps = {
  aracId: number;
  onAracGuncellendi?: (arac: AracDetay) => void;
};

type Sekme = "kilometre" | "bakim" | "lastik" | AracParcaKategorisi;

type IcerikModu = "goruntule" | "form";

type GeriAlKaydi = {
  tur: "gecmis";
  aracId: number;
  veri: AracBilgiGecmisiKaydi;
  etiket: string;
};

const SEKME_ETIKETLERI: Record<Sekme, string> = {
  kilometre: "Kilometre",
  bakim: "Bakım",
  lastik: "Lastik",
  ...ARAC_PARCA_ETIKETLERI,
};

const SEKMELER: Sekme[] = [
  "kilometre",
  "bakim",
  "lastik",
  ...ARAC_PARCA_KATEGORILERI,
];

const inputSinifi =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100";

function parcaSekmesiMi(sekme: Sekme): sekme is AracParcaKategorisi {
  return ARAC_PARCA_KATEGORILERI.includes(sekme as AracParcaKategorisi);
}

function BilgiSatiri({
  etiket,
  deger,
}: {
  etiket: string;
  deger: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">
        {etiket}
      </p>
      <p className="mt-1 text-sm text-zinc-100">{deger}</p>
    </div>
  );
}

function EkleButonu({
  etiket,
  onClick,
}: {
  etiket: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 px-4 py-6 text-zinc-400 transition-colors hover:border-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-600 text-xl leading-none">
        +
      </span>
      <span className="text-sm">{etiket} ekle</span>
    </button>
  );
}

export default function AracBilgiSekmeleri({
  aracId,
  onAracGuncellendi,
}: AracBilgiSekmeleriProps) {
  const [arac, setArac] = useState<AracDetay | null>(null);
  const [aktifSekme, setAktifSekme] = useState<Sekme>("kilometre");
  const [icerikModu, setIcerikModu] = useState<IcerikModu>("goruntule");
  const [kilometre, setKilometre] = useState("");
  const [bakimForm, setBakimForm] = useState<BakimFormVerisi>(bosBakimFormu());
  const [lastikForm, setLastikForm] = useState<LastikFormVerisi>(bosLastikFormu());
  const [gecmisKayitlari, setGecmisKayitlari] = useState<AracBilgiGecmisiKaydi[]>(
    [],
  );
  const [gecmisSayilari, setGecmisSayilari] = useState<
    Partial<Record<AracBilgiGecmisiTuru, number>>
  >({});
  const [gecmisYukleniyor, setGecmisYukleniyor] = useState(false);
  const [gecmisYenileme, setGecmisYenileme] = useState(0);
  const [parcaFormlari, setParcaFormlari] = useState<
    Record<AracParcaKategorisi, AracParcaFormVerisi>
  >(() =>
    Object.fromEntries(
      ARAC_PARCA_KATEGORILERI.map((kategori) => [kategori, bosParcaFormu()]),
    ) as Record<AracParcaKategorisi, AracParcaFormVerisi>,
  );
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [veriYukleniyor, setVeriYukleniyor] = useState(true);
  const [bekliyor, baslat] = useTransition();
  const {
    geriAlKaydi,
    geriAlKalan,
    goster: geriAlGoster,
    temizle: geriAlTemizle,
  } = useGeriAl<GeriAlKaydi>();

  function gecmisSayilariniYenile() {
    void aracBilgiGecmisSayilariniGetir(aracId).then(setGecmisSayilari);
  }

  function gecmisiYenile() {
    setGecmisYenileme((onceki) => onceki + 1);
    gecmisSayilariniYenile();
  }

  function gecmisSilindi(kayit: AracBilgiGecmisiKaydi) {
    geriAlGoster({
      tur: "gecmis",
      aracId,
      veri: kayit,
      etiket: "Arşivlenmiş kayıt",
    });
  }

  function formlariDoldur(detay: AracDetay) {
    setKilometre(detay.kilometre.toString());
    setBakimForm(bakimFormaDonustur(detay));
    setLastikForm(lastikFormaDonustur(detay));
    setParcaFormlari(
      Object.fromEntries(
        ARAC_PARCA_KATEGORILERI.map((kategori) => [
          kategori,
          parcayiFormaDonustur(
            detay.parcalar.find((parca) => parca.kategori === kategori),
          ),
        ]),
      ) as Record<AracParcaKategorisi, AracParcaFormVerisi>,
    );
  }

  useEffect(() => {
    let iptal = false;

    async function aracVerisiniYukle() {
      setVeriYukleniyor(true);
      setHata("");

      try {
        const detay = await aracDetayGetir(aracId);
        if (iptal) return;

        if (!detay) {
          setArac(null);
          setHata("Araç bilgisi bulunamadı.");
          return;
        }

        setArac(detay);
        formlariDoldur(detay);
        const sayilar = await aracBilgiGecmisSayilariniGetir(aracId);
        if (!iptal) {
          setGecmisSayilari(sayilar);
        }
      } catch (error) {
        if (!iptal) {
          setArac(null);
          setHata(
            error instanceof Error
              ? error.message
              : "Araç bilgisi yüklenemedi.",
          );
        }
      } finally {
        if (!iptal) {
          setVeriYukleniyor(false);
        }
      }
    }

    void aracVerisiniYukle();

    return () => {
      iptal = true;
    };
  }, [aracId]);

  useEffect(() => {
    let iptal = false;

    async function gecmisiYukle() {
      setGecmisYukleniyor(true);
      try {
        const kayitlar = await aracBilgiGecmisiniGetir(
          aracId,
          aktifSekme as AracBilgiGecmisiTuru,
        );
        if (!iptal) {
          setGecmisKayitlari(kayitlar);
        }
      } catch (error) {
        if (!iptal) {
          setGecmisKayitlari([]);
          console.error(error);
        }
      } finally {
        if (!iptal) {
          setGecmisYukleniyor(false);
        }
      }
    }

    void gecmisiYukle();

    return () => {
      iptal = true;
    };
  }, [aracId, aktifSekme, gecmisYenileme]);

  function aracDurumunuGuncelle(detay: AracDetay) {
    setArac(detay);
    formlariDoldur(detay);
    setGecmisYenileme((onceki) => onceki + 1);
    onAracGuncellendi?.(detay);
  }

  function sekmeVerisiVarMi(sekme: Sekme) {
    if (sekme === "kilometre") return true;
    return (gecmisSayilari[sekme as AracBilgiGecmisiTuru] ?? 0) > 0;
  }

  function sekmeSec(sekme: Sekme) {
    setAktifSekme(sekme);
    setIcerikModu("goruntule");
    setMesaj("");
    setHata("");
  }

  function duzenlemeyeGec() {
    if (!arac || aktifSekme !== "kilometre") return;
    formlariDoldur(arac);
    setIcerikModu("form");
    setMesaj("");
    setHata("");
  }

  function eklemeyeGec() {
    if (aktifSekme === "bakim") {
      setBakimForm(bosBakimFormu());
    } else if (aktifSekme === "lastik") {
      setLastikForm(bosLastikFormu());
    } else if (parcaSekmesiMi(aktifSekme)) {
      setParcaFormlari((onceki) => ({
        ...onceki,
        [aktifSekme]: bosParcaFormu(),
      }));
    }

    setIcerikModu("form");
    setMesaj("");
    setHata("");
  }

  function formuIptalEt() {
    if (arac) {
      formlariDoldur(arac);
    }
    setIcerikModu("goruntule");
    setHata("");
  }

  function kaydet() {
    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        if (aktifSekme === "kilometre") {
          const guncel = await aracKilometreGuncelle(aracId, Number(kilometre));
          aracDurumunuGuncelle(guncel);
          setMesaj("Kilometre güncellendi.");
          setIcerikModu("goruntule");
          return;
        }

        if (aktifSekme === "bakim") {
          const guncel = await aracBakimGuncelle(aracId, bakimForm);
          aracDurumunuGuncelle(guncel);
          setMesaj("Bakım kaydı eklendi.");
          setIcerikModu("goruntule");
          return;
        }

        if (aktifSekme === "lastik") {
          const guncel = await aracLastikGuncelle(aracId, lastikForm);
          aracDurumunuGuncelle(guncel);
          setMesaj("Lastik kaydı eklendi.");
          setIcerikModu("goruntule");
          return;
        }

        if (parcaSekmesiMi(aktifSekme)) {
          const guncel = await aracParcaGuncelle(
            aracId,
            aktifSekme,
            parcaFormlari[aktifSekme],
          );
          aracDurumunuGuncelle(guncel);
          setMesaj(`${SEKME_ETIKETLERI[aktifSekme]} kaydı eklendi.`);
          setIcerikModu("goruntule");
        }
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Kayıt işlemi başarısız.",
        );
      }
    });
  }

  function geriAl() {
    if (!geriAlKaydi) return;

    const kayit = geriAlKaydi;
    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        await aracBilgiGecmisiGeriYukle(kayit.aracId, kayit.veri);
        gecmisiYenile();
        geriAlTemizle();
        setMesaj(`${kayit.etiket} geri yüklendi.`);
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Geri alma başarısız.",
        );
      }
    });
  }

  function parcaFormGuncelle(
    kategori: AracParcaKategorisi,
    alan: keyof AracParcaFormVerisi,
    deger: string,
  ) {
    setParcaFormlari((onceki) => ({
      ...onceki,
      [kategori]: {
        ...onceki[kategori],
        [alan]: deger,
      },
    }));
  }

  function kayitSekmesiGorunumu(
    sekme: Exclude<Sekme, "kilometre">,
    firmaPanel?: ReactNode,
  ) {
    return (
      <div className="space-y-4">
        {firmaPanel}
        <EkleButonu
          etiket={SEKME_ETIKETLERI[sekme]}
          onClick={eklemeyeGec}
        />
        {kayitListesi(SEKME_ETIKETLERI[sekme])}
      </div>
    );
  }

  function kayitListesi(sekmeEtiketi: string) {
    return (
      <GecmisListesi
        aracId={aracId}
        kayitlar={gecmisKayitlari}
        yukleniyor={gecmisYukleniyor}
        onYenile={gecmisiYenile}
        onGecmisSilindi={gecmisSilindi}
        baslik="Kayıtlar"
        herZamanGoster
        bosMesaj={`Henüz ${sekmeEtiketi.toLowerCase()} kaydı yok.`}
      />
    );
  }

  const ozetMetni = (() => {
    if (veriYukleniyor) return "Yükleniyor...";
    if (hata) return "Yüklenemedi";
    if (!arac) return "Kayıt yok";

    if (aktifSekme === "kilometre") {
      return `${arac.kilometre.toLocaleString("tr-TR")} km`;
    }

    if (gecmisKayitlari.length > 0) {
      return gecmisKaydiOzeti(gecmisKayitlari[0]);
    }

    const sayi = gecmisSayilari[aktifSekme as AracBilgiGecmisiTuru] ?? 0;
    if (sayi > 0) {
      return `${sayi} kayıt`;
    }

    return "Kayıt yok";
  })();

  function goruntuleIcerigi() {
    if (veriYukleniyor) {
      return (
        <p className="py-8 text-center text-sm text-zinc-500">Yükleniyor...</p>
      );
    }

    if (hata) {
      return (
        <p className="rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-400">
          {hata}
        </p>
      );
    }

    if (!arac) {
      return (
        <p className="py-8 text-center text-sm text-zinc-500">
          Araç bilgisi yüklenemedi.
        </p>
      );
    }

    if (aktifSekme === "kilometre") {
      return (
        <div className="space-y-3">
          <BilgiSatiri
            etiket="Güncel kilometre"
            deger={`${arac.kilometre.toLocaleString("tr-TR")} km`}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={duzenlemeyeGec}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
            >
              Düzenle
            </button>
          </div>
          <GecmisListesi
            aracId={aracId}
            kayitlar={gecmisKayitlari}
            yukleniyor={gecmisYukleniyor}
            onYenile={gecmisiYenile}
            onGecmisSilindi={gecmisSilindi}
          />
        </div>
      );
    }

    if (aktifSekme === "bakim") {
      return kayitSekmesiGorunumu(
        "bakim",
        <ArananFirmaPanel aracId={aracId} tur="bakim" />,
      );
    }

    if (aktifSekme === "lastik") {
      return kayitSekmesiGorunumu("lastik");
    }

    if (aktifSekme === "fren_balata") {
      return kayitSekmesiGorunumu(
        "fren_balata",
        <ArananFirmaPanel aracId={aracId} tur="fren_balata" />,
      );
    }

    return kayitSekmesiGorunumu(aktifSekme);
  }

  function formIcerigi() {
    return (
      <>
        {arac && aktifSekme === "bakim" ? (
          <div className="mb-4">
            <ArananFirmaPanel aracId={aracId} tur="bakim" />
          </div>
        ) : null}

        {arac && aktifSekme === "fren_balata" ? (
          <div className="mb-4">
            <ArananFirmaPanel aracId={aracId} tur="fren_balata" />
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          {aktifSekme === "kilometre" ? (
            <label className="grid gap-1 text-sm md:col-span-2">
              <span className="text-zinc-500">Güncel kilometre</span>
              <input
                type="number"
                min={0}
                value={kilometre}
                onChange={(event) => setKilometre(event.target.value)}
                className={inputSinifi}
              />
            </label>
          ) : null}

          {aktifSekme === "bakim" ? (
            <>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Son bakım tarihi</span>
                <input
                  type="date"
                  value={bakimForm.bakimTarihi}
                  onChange={(event) =>
                    setBakimForm((onceki) => ({
                      ...onceki,
                      bakimTarihi: event.target.value,
                    }))
                  }
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Bakım kilometresi</span>
                <input
                  type="number"
                  min={0}
                  value={bakimForm.bakimKilometresi}
                  onChange={(event) =>
                    setBakimForm((onceki) => ({
                      ...onceki,
                      bakimKilometresi: event.target.value,
                    }))
                  }
                  placeholder="45000"
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Servis</span>
                <input
                  value={bakimForm.bakimServisi}
                  onChange={(event) =>
                    setBakimForm((onceki) => ({
                      ...onceki,
                      bakimServisi: event.target.value,
                    }))
                  }
                  placeholder="Renault Yetkili Servis"
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="text-zinc-500">Yapılan işler</span>
                <textarea
                  rows={3}
                  value={bakimForm.bakimAciklamasi}
                  onChange={(event) =>
                    setBakimForm((onceki) => ({
                      ...onceki,
                      bakimAciklamasi: event.target.value,
                    }))
                  }
                  placeholder="Yağ değişimi, filtre değişimi, genel kontrol..."
                  className={inputSinifi}
                />
              </label>
            </>
          ) : null}

          {aktifSekme === "lastik" ? (
            <>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Lastik türü</span>
                <select
                  value={lastikForm.lastikTuru}
                  onChange={(event) =>
                    setLastikForm((onceki) => ({
                      ...onceki,
                      lastikTuru: event.target.value as LastikFormVerisi["lastikTuru"],
                    }))
                  }
                  className={inputSinifi}
                >
                  <option value="">Seçin</option>
                  <option value="kislik">{LASTIK_TURU_ETIKETLERI.kislik}</option>
                  <option value="yazlik">{LASTIK_TURU_ETIKETLERI.yazlik}</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Değişim tarihi</span>
                <input
                  type="date"
                  value={lastikForm.lastikTarihi}
                  onChange={(event) =>
                    setLastikForm((onceki) => ({
                      ...onceki,
                      lastikTarihi: event.target.value,
                    }))
                  }
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Değişim yeri</span>
                <input
                  value={lastikForm.lastikDegisimYeri}
                  onChange={(event) =>
                    setLastikForm((onceki) => ({
                      ...onceki,
                      lastikDegisimYeri: event.target.value,
                    }))
                  }
                  placeholder="Lastiğin değiştirildiği servis veya adres"
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="text-zinc-500">Muhafaza yeri</span>
                <input
                  value={lastikForm.lastikMuhafazaYeri}
                  onChange={(event) =>
                    setLastikForm((onceki) => ({
                      ...onceki,
                      lastikMuhafazaYeri: event.target.value,
                    }))
                  }
                  placeholder="Lastiğin saklandığı depo veya alan"
                  className={inputSinifi}
                />
              </label>
            </>
          ) : null}

          {parcaSekmesiMi(aktifSekme) ? (
            <>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Son değişim tarihi</span>
                <input
                  type="date"
                  value={parcaFormlari[aktifSekme].sonDegisimTarihi}
                  onChange={(event) =>
                    parcaFormGuncelle(
                      aktifSekme,
                      "sonDegisimTarihi",
                      event.target.value,
                    )
                  }
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Değişim kilometresi</span>
                <input
                  type="number"
                  min={0}
                  value={parcaFormlari[aktifSekme].sonDegisimKm}
                  onChange={(event) =>
                    parcaFormGuncelle(
                      aktifSekme,
                      "sonDegisimKm",
                      event.target.value,
                    )
                  }
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Servis</span>
                <input
                  value={parcaFormlari[aktifSekme].servisAdi}
                  onChange={(event) =>
                    parcaFormGuncelle(
                      aktifSekme,
                      "servisAdi",
                      event.target.value,
                    )
                  }
                  placeholder="Renault Yetkili Servis"
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="text-zinc-500">Notlar</span>
                <textarea
                  rows={2}
                  value={parcaFormlari[aktifSekme].notlar}
                  onChange={(event) =>
                    parcaFormGuncelle(
                      aktifSekme,
                      "notlar",
                      event.target.value,
                    )
                  }
                  placeholder="Ek bilgi"
                  className={inputSinifi}
                />
              </label>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={bekliyor || !arac}
            onClick={kaydet}
            className="rounded-lg bg-zinc-100 px-4 py-2 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
          >
            {bekliyor ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            disabled={bekliyor}
            onClick={formuIptalEt}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-60"
          >
            İptal
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm text-zinc-100">Araç bilgileri</h4>
          <p className="mt-1 text-xs text-zinc-500">{ozetMetni}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {SEKMELER.map((sekme) => {
          const veriVar = arac ? sekmeVerisiVarMi(sekme) : false;

          return (
            <button
              key={sekme}
              type="button"
              onClick={() => sekmeSec(sekme)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                aktifSekme === sekme
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {SEKME_ETIKETLERI[sekme]}
              {veriVar && sekme !== "kilometre" ? (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    aktifSekme === sekme ? "bg-emerald-600" : "bg-emerald-400"
                  }`}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
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

      <div className="mt-4">
        {icerikModu === "goruntule" ? goruntuleIcerigi() : formIcerigi()}
      </div>
    </section>

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
