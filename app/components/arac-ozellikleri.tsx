"use client";

import { useState } from "react";
import {
  ARAC_DURUM_ETIKETLERI,
  aracDurumunaDonustur,
} from "@/app/lib/arac-durumu";
import { baslikFormatla, markaEtiketi } from "@/app/lib/arac-grupla";

type AracOzellikleriProps = {
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

export default function AracOzellikleri({
  plaka,
  marka,
  model,
  yil,
  sasiNo,
  aktifGorevdeMi,
  bakimdaMi,
  atananKisi,
  atananKisiTelefon,
}: AracOzellikleriProps) {
  const [acik, setAcik] = useState(false);
  const durum = aracDurumunaDonustur(aktifGorevdeMi, bakimdaMi);

  return (
    <div className="relative" onMouseLeave={() => setAcik(false)}>
      <button
        type="button"
        onClick={() => setAcik((onceki) => !onceki)}
        className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
      >
        Özellikleri
      </button>

      {acik ? (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Araç özellikleri
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Marka</dt>
              <dd className="text-right text-zinc-100">{markaEtiketi(marka)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Model</dt>
              <dd className="text-right text-zinc-100">
                {baslikFormatla(model)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Plaka</dt>
              <dd className="text-right text-zinc-100">{plaka}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Yıl</dt>
              <dd className="text-right text-zinc-100">{yil}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Şasi</dt>
              <dd className="text-right text-zinc-100">{sasiNo ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Zimmetli</dt>
              <dd className="text-right text-zinc-100">
                {atananKisi ?? "—"}
                {atananKisiTelefon ? (
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    {atananKisiTelefon}
                  </span>
                ) : null}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-500">Durum</dt>
              <dd className="text-right text-zinc-100">
                {ARAC_DURUM_ETIKETLERI[durum]}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
