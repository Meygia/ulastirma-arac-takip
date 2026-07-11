"use client";

import { useEffect, useRef, useState } from "react";

export const GERI_AL_SURESI = 10;

export function useGeriAl<T>() {
  const [geriAlKaydi, setGeriAlKaydi] = useState<T | null>(null);
  const [geriAlKalan, setGeriAlKalan] = useState(0);
  const zamanlayiciRef = useRef<number | null>(null);

  function zamanlayiciyiTemizle() {
    if (zamanlayiciRef.current !== null) {
      window.clearInterval(zamanlayiciRef.current);
      zamanlayiciRef.current = null;
    }
  }

  function goster(kayit: T) {
    zamanlayiciyiTemizle();
    setGeriAlKaydi(kayit);
    setGeriAlKalan(GERI_AL_SURESI);

    const bitis = Date.now() + GERI_AL_SURESI * 1000;
    zamanlayiciRef.current = window.setInterval(() => {
      const kalan = Math.max(0, Math.ceil((bitis - Date.now()) / 1000));

      if (kalan <= 0) {
        zamanlayiciyiTemizle();
        setGeriAlKaydi(null);
        setGeriAlKalan(0);
        return;
      }

      setGeriAlKalan(kalan);
    }, 250);
  }

  function temizle() {
    zamanlayiciyiTemizle();
    setGeriAlKaydi(null);
    setGeriAlKalan(0);
  }

  useEffect(() => () => zamanlayiciyiTemizle(), []);

  return { geriAlKaydi, geriAlKalan, goster, temizle };
}

type GeriAlBildirimiProps = {
  etiket: string;
  kalan: number;
  bekliyor: boolean;
  onGeriAl: () => void;
};

export function GeriAlBildirimi({
  etiket,
  kalan,
  bekliyor,
  onGeriAl,
}: GeriAlBildirimiProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-2xl">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-100">{etiket} silindi</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {kalan} sn içinde geri alabilirsiniz
        </p>
      </div>
      <button
        type="button"
        disabled={bekliyor}
        onClick={onGeriAl}
        className="shrink-0 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-60"
      >
        Geri al
      </button>
    </div>
  );
}
