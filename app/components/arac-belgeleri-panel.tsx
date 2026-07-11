"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  belgeDosyasiniTemizle,
  belgeGeriYukle,
  belgeGuncelle,
  belgeSil,
  belgeYukle,
  belgeleriGetir,
} from "@/app/actions/belge-actions";
import {
  GeriAlBildirimi,
  GERI_AL_SURESI,
  useGeriAl,
} from "@/app/components/geri-al-bildirimi";
import {
  BELGE_TURU_ETIKETLERI,
  BELGE_TURLERI,
  belgeBoyutuFormatla,
  belgeDosyaUzantisi,
  bosBelgeFormu,
  type AracBelgesiKaydi,
  type BelgeTuru,
  type BelgeYuklemeFormVerisi,
} from "@/app/lib/arac-belgeleri";
import { kisaTarihFormatla } from "@/app/lib/arac-parcalari";

const inputSinifi =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100";

type AracBelgeleriPanelProps = {
  aracId: number;
};

type FormModu = "kapali" | "yukle" | "duzenle";

export default function AracBelgeleriPanel({ aracId }: AracBelgeleriPanelProps) {
  const [belgeler, setBelgeler] = useState<AracBelgesiKaydi[]>([]);
  const [formModu, setFormModu] = useState<FormModu>("kapali");
  const [form, setForm] = useState<BelgeYuklemeFormVerisi>(bosBelgeFormu());
  const [duzenlenenBelgeId, setDuzenlenenBelgeId] = useState<number | null>(
    null,
  );
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bekliyor, baslat] = useTransition();
  const dosyaRef = useRef<HTMLInputElement>(null);
  const {
    geriAlKaydi,
    geriAlKalan,
    goster: geriAlGoster,
    temizle: geriAlTemizle,
  } = useGeriAl<AracBelgesiKaydi>();

  async function listeyiYenile() {
    setYukleniyor(true);
    try {
      const kayitlar = await belgeleriGetir(aracId);
      setBelgeler(kayitlar);
    } catch (error) {
      setHata(
        error instanceof Error ? error.message : "Belgeler yüklenemedi.",
      );
    } finally {
      setYukleniyor(false);
    }
  }

  useEffect(() => {
    void listeyiYenile();
  }, [aracId]);

  function formuKapat() {
    setFormModu("kapali");
    setDuzenlenenBelgeId(null);
    setForm(bosBelgeFormu());
    if (dosyaRef.current) {
      dosyaRef.current.value = "";
    }
  }

  function yuklemeyeGec() {
    setForm(bosBelgeFormu());
    setDuzenlenenBelgeId(null);
    setFormModu("yukle");
    setMesaj("");
    setHata("");
  }

  function duzenlemeyeGec(belge: AracBelgesiKaydi) {
    setForm({
      tur: belge.tur,
      baslik: belge.baslik ?? "",
      aciklama: belge.aciklama ?? "",
    });
    setDuzenlenenBelgeId(belge.id);
    setFormModu("duzenle");
    setMesaj("");
    setHata("");
  }

  function belgeYukleFormu() {
    const dosya = dosyaRef.current?.files?.[0];
    if (!dosya) {
      setHata("Yüklenecek dosya seçin.");
      return;
    }

    setHata("");
    setMesaj("");

    const formData = new FormData();
    formData.set("tur", form.tur);
    formData.set("baslik", form.baslik);
    formData.set("aciklama", form.aciklama);
    formData.set("dosya", dosya);

    baslat(async () => {
      try {
        await belgeYukle(aracId, formData);
        await listeyiYenile();
        formuKapat();
        setMesaj("Belge yüklendi.");
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Yükleme başarısız.",
        );
      }
    });
  }

  function belgeDuzenleKaydet() {
    if (!duzenlenenBelgeId) return;

    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        await belgeGuncelle(aracId, duzenlenenBelgeId, form);
        await listeyiYenile();
        formuKapat();
        setMesaj("Belge bilgisi güncellendi.");
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Güncelleme başarısız.",
        );
      }
    });
  }

  function belgeyiSil(belge: AracBelgesiKaydi) {
    setHata("");
    setMesaj("");

    baslat(async () => {
      try {
        const silinen = await belgeSil(aracId, belge.id);
        await listeyiYenile();
        if (duzenlenenBelgeId === belge.id) {
          formuKapat();
        }
        setMesaj("Belge silindi.");
        geriAlGoster(silinen);
      } catch (error) {
        setHata(error instanceof Error ? error.message : "Silme başarısız.");
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
        await belgeGeriYukle(kayit);
        await listeyiYenile();
        geriAlTemizle();
        setMesaj("Belge geri yüklendi.");
      } catch (error) {
        setHata(
          error instanceof Error ? error.message : "Geri alma başarısız.",
        );
      }
    });
  }

  useEffect(() => {
    if (!geriAlKaydi) return;

    const zamanlayici = window.setTimeout(() => {
      void belgeDosyasiniTemizle(geriAlKaydi.dosyaYolu);
    }, GERI_AL_SURESI * 1000);

    return () => window.clearTimeout(zamanlayici);
  }, [geriAlKaydi]);

  function belgeBasligi(belge: AracBelgesiKaydi) {
    return belge.baslik?.trim() || belge.dosyaAdi;
  }

  return (
    <>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm text-zinc-100">Araç belgeleri</h4>
            <p className="mt-1 text-xs text-zinc-500">
              Tutanak, kaza raporu ve diğer evrakları yükleyin.
            </p>
          </div>
          {formModu === "kapali" ? (
            <button
              type="button"
              onClick={yuklemeyeGec}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
            >
              + Belge yükle
            </button>
          ) : null}
        </div>

        {formModu !== "kapali" ? (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
            <h5 className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              {formModu === "yukle" ? "Yeni belge" : "Belge düzenle"}
            </h5>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Belge türü</span>
                <select
                  value={form.tur}
                  onChange={(event) =>
                    setForm((onceki) => ({
                      ...onceki,
                      tur: event.target.value as BelgeTuru,
                    }))
                  }
                  className={inputSinifi}
                >
                  {BELGE_TURLERI.map((tur) => (
                    <option key={tur} value={tur}>
                      {BELGE_TURU_ETIKETLERI[tur]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-500">Başlık (isteğe bağlı)</span>
                <input
                  value={form.baslik}
                  onChange={(event) =>
                    setForm((onceki) => ({
                      ...onceki,
                      baslik: event.target.value,
                    }))
                  }
                  placeholder="Örn. 2025 trafik kazası tutanağı"
                  className={inputSinifi}
                />
              </label>
              <label className="grid gap-1 text-sm md:col-span-2">
                <span className="text-zinc-500">Açıklama (isteğe bağlı)</span>
                <textarea
                  rows={2}
                  value={form.aciklama}
                  onChange={(event) =>
                    setForm((onceki) => ({
                      ...onceki,
                      aciklama: event.target.value,
                    }))
                  }
                  placeholder="Belge hakkında kısa not"
                  className={inputSinifi}
                />
              </label>
              {formModu === "yukle" ? (
                <label className="grid gap-1 text-sm md:col-span-2">
                  <span className="text-zinc-500">Dosya</span>
                  <input
                    ref={dosyaRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/jpeg,image/png,image/webp"
                    className="block w-full text-sm text-zinc-300 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-2 file:text-xs file:text-zinc-100"
                  />
                  <span className="text-[11px] text-zinc-500">
                    PDF, JPEG, PNG, WEBP veya Word · en fazla 15 MB
                  </span>
                </label>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={bekliyor}
                onClick={formuKapat}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-60"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={bekliyor}
                onClick={
                  formModu === "yukle" ? belgeYukleFormu : belgeDuzenleKaydet
                }
                className="rounded-lg bg-zinc-100 px-4 py-2 text-xs text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
              >
                {bekliyor
                  ? "Kaydediliyor..."
                  : formModu === "yukle"
                    ? "Yükle"
                    : "Kaydet"}
              </button>
            </div>
          </div>
        ) : null}

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
          {yukleniyor ? (
            <p className="text-xs text-zinc-500">Belgeler yükleniyor...</p>
          ) : belgeler.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
              Bu araç için henüz belge yüklenmemiş.
            </p>
          ) : (
            <ul className="space-y-2">
              {belgeler.map((belge) => (
                <li
                  key={belge.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-zinc-100">
                          {belgeBasligi(belge)}
                        </p>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                          {BELGE_TURU_ETIKETLERI[belge.tur]}
                        </span>
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
                          {belgeDosyaUzantisi(belge.mimeType)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {belge.dosyaAdi} · {belgeBoyutuFormatla(belge.boyut)} ·{" "}
                        {kisaTarihFormatla(belge.yuklenmeTarihi)}
                      </p>
                      {belge.aciklama?.trim() ? (
                        <p className="mt-2 text-sm text-zinc-300">
                          {belge.aciklama}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={belge.dosyaYolu}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
                      >
                        Görüntüle
                      </a>
                      <button
                        type="button"
                        disabled={bekliyor}
                        onClick={() => duzenlemeyeGec(belge)}
                        className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-60"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={bekliyor}
                        onClick={() => belgeyiSil(belge)}
                        className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/70 disabled:opacity-60"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {geriAlKaydi ? (
        <GeriAlBildirimi
          etiket={belgeBasligi(geriAlKaydi)}
          kalan={geriAlKalan}
          bekliyor={bekliyor}
          onGeriAl={geriAl}
        />
      ) : null}
    </>
  );
}
