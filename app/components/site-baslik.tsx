import Image from "next/image";
import Link from "next/link";

type SiteBaslikProps = {
  aktif?: "ana" | "yonetim";
};

export default function SiteBaslik({ aktif = "ana" }: SiteBaslikProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-5 md:gap-6">
          <Link href="/" className="shrink-0" aria-label="Ana sayfa">
            <Image
              src="/iletisim-baskanligi-amblem.png"
              alt="T.C. Cumhurbaşkanlığı İletişim Başkanlığı"
              width={96}
              height={96}
              className="h-[4.5rem] w-[4.5rem] object-contain md:h-20 md:w-20"
              priority
              unoptimized
            />
          </Link>
          <div className="min-w-0 border-l border-zinc-800 pl-5 md:pl-6">
            <h1 className="text-base font-medium leading-snug text-zinc-100 md:text-lg lg:text-xl">
              Destek Hizmetleri Daire Başkanlığı
            </h1>
            <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.1em] text-zinc-500 md:text-xs">
              {aktif === "yonetim"
                ? "Ulaştırma Birimi · Araç Yönetimi"
                : "Ulaştırma Birimi Araç Kontrol Paneli"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {aktif === "yonetim" ? (
            <Link
              href="/"
              className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Ana sayfa
            </Link>
          ) : (
            <Link
              href="/arac-yonetimi"
              className="rounded-full border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
            >
              Araç yönetimi
            </Link>
          )}
          <span className="rounded-full bg-emerald-950 px-4 py-2 text-sm text-emerald-400 ring-1 ring-emerald-800">
            Filo paneli aktif
          </span>
        </div>
      </div>
    </header>
  );
}
