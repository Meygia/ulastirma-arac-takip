"use client";

import { useMemo, useState } from "react";
import AracDurumGorunumu from "@/app/components/arac-durum-gorunumu";
import MarkaLogosu from "@/app/components/marka-logosu";
import {
  ARAC_DURUM_ETIKETLERI,
  aracDurumunaDonustur,
  aracDurumuSinifi,
} from "@/app/lib/arac-durumu";
import {
  baslikFormatla,
  ilkSecilebilirArac,
  markaEtiketi,
  type MarkaGrubu,
} from "@/app/lib/arac-grupla";

type AracSekmeleriProps = {
  gruplar: MarkaGrubu[];
};

export default function AracSekmeleri({ gruplar }: AracSekmeleriProps) {
  const baslangic = ilkSecilebilirArac(gruplar);

  const [aktifMarka, setAktifMarka] = useState(baslangic.marka);
  const [aktifModel, setAktifModel] = useState(baslangic.model);
  const [aktifAracId, setAktifAracId] = useState(baslangic.aracId);

  const seciliMarka = useMemo(
    () => gruplar.find((grup) => grup.marka === aktifMarka),
    [gruplar, aktifMarka],
  );

  const seciliModel = useMemo(
    () => seciliMarka?.modeller.find((grup) => grup.model === aktifModel),
    [seciliMarka, aktifModel],
  );

  const seciliArac = useMemo(
    () => seciliModel?.araclar.find((arac) => arac.id === aktifAracId),
    [seciliModel, aktifAracId],
  );

  function markaSec(marka: string) {
    const grup = gruplar.find((item) => item.marka === marka);
    const ilkModel = grup?.modeller[0];
    const ilkArac = ilkModel?.araclar[0];

    setAktifMarka(marka);
    setAktifModel(ilkModel?.model ?? "");
    setAktifAracId(ilkArac?.id ?? 0);
  }

  function modelSec(model: string) {
    const grup = seciliMarka?.modeller.find((item) => item.model === model);
    const ilkArac = grup?.araclar[0];

    setAktifModel(model);
    setAktifAracId(ilkArac?.id ?? 0);
  }

  return (
    <section className="flex min-h-[560px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-sm">
      <aside className="flex w-72 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="border-b border-zinc-800 px-4 py-4">
          <h2 className="text-lg text-zinc-100">Araç Seçimi</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Marka, model ve plaka seçin.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-2">
            {gruplar.map((markaGrubu) => {
              const markaAktif = markaGrubu.marka === aktifMarka;
              const aracSayisi = markaGrubu.modeller.reduce(
                (toplam, model) => toplam + model.araclar.length,
                0,
              );

              return (
                <div
                  key={markaGrubu.marka}
                  className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
                >
                  <button
                    type="button"
                    onClick={() => markaSec(markaGrubu.marka)}
                    className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors ${
                      markaAktif
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <MarkaLogosu marka={markaGrubu.marka} aktif={markaAktif} />
                      {markaEtiketi(markaGrubu.marka)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        markaAktif
                          ? "bg-zinc-900/15 text-zinc-900"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {aracSayisi}
                    </span>
                  </button>

                  {markaAktif && (
                    <div className="border-t border-zinc-800 bg-zinc-950 px-2 py-2">
                      {markaGrubu.modeller.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-zinc-500">
                          Bu marka için kayıtlı model yok.
                        </p>
                      ) : (
                        markaGrubu.modeller.map((modelGrubu) => {
                          const modelAktif = modelGrubu.model === aktifModel;

                          return (
                            <div key={modelGrubu.model} className="mb-2 last:mb-0">
                              <button
                                type="button"
                                onClick={() => modelSec(modelGrubu.model)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                  modelAktif
                                    ? "bg-blue-600 text-white"
                                    : "text-zinc-300 hover:bg-zinc-800"
                                }`}
                              >
                                <span>{baslikFormatla(modelGrubu.model)}</span>
                                <span className="text-xs opacity-80">
                                  {modelGrubu.araclar.length}
                                </span>
                              </button>

                              {modelAktif && (
                                <div className="mt-1 space-y-1 pl-2">
                                  {modelGrubu.araclar.map((arac) => {
                                    const aracAktif = arac.id === aktifAracId;
                                    const durum = aracDurumunaDonustur(
                                      arac.aktifGorevdeMi,
                                      arac.bakimdaMi,
                                    );

                                    return (
                                      <button
                                        key={arac.id}
                                        type="button"
                                        onClick={() => setAktifAracId(arac.id)}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                          aracAktif
                                            ? "bg-emerald-600 text-white"
                                            : "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700 hover:bg-emerald-950 hover:text-emerald-300"
                                        }`}
                                      >
                                        <span>
                                          <span className="block">{arac.plaka}</span>
                                          <span className="mt-0.5 block text-[10px] opacity-70">
                                            {arac.atananKisi ?? "Zimmet yok"}
                                          </span>
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-0.5 text-[10px] ring-1 ${aracDurumuSinifi(durum)}`}
                                        >
                                          {ARAC_DURUM_ETIKETLERI[durum]}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {seciliArac ? (
          <div className="flex flex-1 flex-col p-4 md:p-6">
            <AracDurumGorunumu
              aracId={seciliArac.id}
              plaka={seciliArac.plaka}
              marka={seciliArac.marka}
              model={seciliArac.model}
              yil={seciliArac.yil}
              sasiNo={seciliArac.sasiNo}
              aktifGorevdeMi={seciliArac.aktifGorevdeMi}
              bakimdaMi={seciliArac.bakimdaMi}
              atananKisi={seciliArac.atananKisi}
              atananKisiTelefon={seciliArac.atananKisiTelefon}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-zinc-500">
            {seciliMarka?.modeller.length
              ? "Bu model için kayıtlı araç bulunmuyor."
              : "Bu marka için henüz kayıtlı araç bulunmuyor."}
          </div>
        )}
      </div>
    </section>
  );
}
