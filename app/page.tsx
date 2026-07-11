import AracSekmeleri from "@/app/components/arac-sekmeleri";
import SiteBaslik from "@/app/components/site-baslik";
import {
  araclariTanimliMarkalarlaGrupla,
  aracKayitlariniSirala,
  TANIMLI_MARKALAR,
} from "@/app/lib/arac-grupla";
import { getPrisma } from "@/app/lib/prisma";

export default async function Home() {
  const araclar = await getPrisma().arac.findMany();

  const aracKayitlari = aracKayitlariniSirala(
    araclar.map((arac) => ({
    id: arac.id,
    plaka: arac.plaka,
    marka: arac.marka,
    model: arac.model,
    yil: arac.yil,
    sasiNo: arac.sasiNo,
    kilometre: arac.kilometre,
    aktifGorevdeMi: arac.aktifGorevdeMi,
    bakimdaMi: arac.bakimdaMi,
    bakimTarihi: arac.bakimTarihi?.toISOString() ?? null,
    bakimServisi: arac.bakimServisi,
    atananKisi: arac.atananKisi,
    atananKisiTelefon: arac.atananKisiTelefon,
  })),
  );

  const gruplar = araclariTanimliMarkalarlaGrupla(aracKayitlari);

  const toplamArac = araclar.length;
  const gorevde = araclar.filter((arac) => arac.aktifGorevdeMi).length;
  const bakimda = araclar.filter((arac) => arac.bakimdaMi).length;
  const musait = toplamArac - gorevde - bakimda;
  const markaSayisi = TANIMLI_MARKALAR.length;
  const modelSayisi = gruplar.reduce(
    (toplam, grup) => toplam + grup.modeller.length,
    0,
  );

  return (
    <div className="min-h-full bg-zinc-950">
      <SiteBaslik />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Toplam Araç</p>
            <p className="mt-2 text-4xl text-zinc-100">{toplamArac}</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Marka</p>
            <p className="mt-2 text-4xl text-zinc-100">{markaSayisi}</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Model</p>
            <p className="mt-2 text-4xl text-zinc-100">{modelSayisi}</p>
          </article>
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
            <p className="text-sm text-zinc-500">Görevde / Bakımda / Müsait</p>
            <p className="mt-2 text-4xl text-zinc-100">
              {gorevde}
              <span className="mx-2 text-2xl text-zinc-600">/</span>
              {bakimda}
              <span className="mx-2 text-2xl text-zinc-600">/</span>
              {musait}
            </p>
          </article>
        </section>

        <div className="mt-8">
          <AracSekmeleri gruplar={gruplar} />
        </div>
      </main>
    </div>
  );
}
