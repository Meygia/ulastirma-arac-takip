"use client";

import Image from "next/image";
import { useActionState } from "react";
import { girisYap, type GirisSonucu } from "@/app/actions/auth-actions";

const baslangic: GirisSonucu | null = null;

export default function GirisFormu() {
  const [durum, aksiyon, bekliyor] = useActionState(girisYap, baslangic);

  return (
    <form action={aksiyon} className="mt-8 space-y-4">
      <div>
        <label htmlFor="kullanici" className="block text-sm text-zinc-400">
          Kullanıcı adı
        </label>
        <input
          id="kullanici"
          name="kullanici"
          type="text"
          autoComplete="username"
          required
          className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-emerald-700/40 focus:ring-2"
        />
      </div>

      <div>
        <label htmlFor="sifre" className="block text-sm text-zinc-400">
          Şifre
        </label>
        <input
          id="sifre"
          name="sifre"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none ring-emerald-700/40 focus:ring-2"
        />
      </div>

      {durum?.hata ? (
        <p className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {durum.hata}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={bekliyor}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {bekliyor ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
    </form>
  );
}

export function GirisSayfaIcerik() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/iletisim-baskanligi-amblem.png"
            alt="T.C. Cumhurbaşkanlığı İletişim Başkanlığı"
            width={88}
            height={88}
            className="h-20 w-20 object-contain"
            priority
            unoptimized
          />
          <h1 className="mt-5 text-xl text-zinc-100">
            Destek Hizmetleri Daire Başkanlığı
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ulaştırma Birimi · Yetkili giriş
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
          <h2 className="text-lg text-zinc-100">Giriş</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Bu panele yalnızca yetkili kullanıcılar erişebilir.
          </p>
          <GirisFormu />
        </div>
      </div>
    </div>
  );
}
