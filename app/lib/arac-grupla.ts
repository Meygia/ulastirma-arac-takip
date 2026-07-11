export type AracKayit = {
  id: number;
  plaka: string;
  marka: string;
  model: string;
  yil: number;
  sasiNo: string | null;
  kilometre: number;
  aktifGorevdeMi: boolean;
  bakimdaMi: boolean;
  bakimTarihi: string | null;
  bakimServisi: string | null;
  atananKisi: string | null;
  atananKisiTelefon: string | null;
};

export type ModelGrubu = {
  model: string;
  araclar: AracKayit[];
};

export type MarkaGrubu = {
  marka: string;
  modeller: ModelGrubu[];
};

export const TANIMLI_MARKALAR = [
  "renault",
  "ford",
  "toyota",
  "togg",
  "audi",
  "skoda",
] as const;

export const MARKA_ETIKETLERI: Record<(typeof TANIMLI_MARKALAR)[number], string> =
  {
    renault: "Renault",
    ford: "Ford",
    toyota: "Toyota",
    togg: "TOGG",
    audi: "Audi",
    skoda: "Skoda",
  };

export const MARKA_LOGOLARI: Record<
  (typeof TANIMLI_MARKALAR)[number],
  string
> = {
  renault: "/markalar/renault.png",
  ford: "/markalar/ford.png",
  toyota: "/markalar/toyota.png",
  togg: "/markalar/togg.png",
  audi: "/markalar/audi.png",
  skoda: "/markalar/skoda.png",
};

export function markaLogoYolu(marka: string) {
  const anahtar = markaAnahtariniNormalizeEt(
    marka,
  ) as (typeof TANIMLI_MARKALAR)[number];

  return MARKA_LOGOLARI[anahtar] ?? null;
}

export function markaAnahtariniNormalizeEt(value: string) {
  return value.trim().toLowerCase();
}

export function baslikFormatla(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function markaEtiketi(marka: string) {
  const anahtar = markaAnahtariniNormalizeEt(
    marka,
  ) as (typeof TANIMLI_MARKALAR)[number];

  return MARKA_ETIKETLERI[anahtar] ?? baslikFormatla(marka);
}

const TURKCE_SIRALAMA: Intl.CollatorOptions = {
  sensitivity: "base",
  numeric: true,
};

export function turkceMetinKarsilastir(a: string, b: string) {
  return a.localeCompare(b, "tr", TURKCE_SIRALAMA);
}

export function markalariEtiketeGoreSirala(
  markalar: readonly string[],
): string[] {
  return [...markalar].sort((a, b) =>
    turkceMetinKarsilastir(markaEtiketi(a), markaEtiketi(b)),
  );
}

export const SIRALI_TANIMLI_MARKALAR = markalariEtiketeGoreSirala(TANIMLI_MARKALAR);

export function aracKayitlariniSirala<
  T extends { marka: string; model: string; plaka: string },
>(araclar: T[]): T[] {
  return [...araclar].sort((a, b) => {
    const markaFark = turkceMetinKarsilastir(
      markaEtiketi(a.marka),
      markaEtiketi(b.marka),
    );
    if (markaFark !== 0) return markaFark;

    const modelFark = turkceMetinKarsilastir(a.model, b.model);
    if (modelFark !== 0) return modelFark;

    return turkceMetinKarsilastir(a.plaka, b.plaka);
  });
}

export function araclariMarkaModelOlarakGrupla(
  araclar: AracKayit[],
): MarkaGrubu[] {
  const markaHaritasi = new Map<string, Map<string, AracKayit[]>>();

  for (const arac of araclar) {
    const marka = markaAnahtariniNormalizeEt(arac.marka);
    const model = arac.model.trim().toLowerCase();

    if (!markaHaritasi.has(marka)) {
      markaHaritasi.set(marka, new Map());
    }

    const modelHaritasi = markaHaritasi.get(marka)!;

    if (!modelHaritasi.has(model)) {
      modelHaritasi.set(model, []);
    }

    modelHaritasi.get(model)!.push(arac);
  }

  return [...markaHaritasi.entries()]
    .sort(([a], [b]) =>
      turkceMetinKarsilastir(markaEtiketi(a), markaEtiketi(b)),
    )
    .map(([marka, modelHaritasi]) => ({
      marka,
      modeller: [...modelHaritasi.entries()]
        .sort(([a], [b]) => turkceMetinKarsilastir(a, b))
        .map(([model, modelAraclari]) => ({
          model,
          araclar: aracKayitlariniSirala(modelAraclari),
        })),
    }));
}

export function araclariTanimliMarkalarlaGrupla(
  araclar: AracKayit[],
): MarkaGrubu[] {
  const grupHaritasi = new Map(
    araclariMarkaModelOlarakGrupla(araclar).map((grup) => [grup.marka, grup]),
  );

  return SIRALI_TANIMLI_MARKALAR.map((marka) => {
    const grup = grupHaritasi.get(marka);
    if (!grup) {
      return { marka, modeller: [] };
    }

    return {
      marka: grup.marka,
      modeller: [...grup.modeller].sort((a, b) =>
        turkceMetinKarsilastir(a.model, b.model),
      ),
    };
  });
}

export function ilkSecilebilirArac(gruplar: MarkaGrubu[]) {
  for (const markaGrubu of gruplar) {
    for (const modelGrubu of markaGrubu.modeller) {
      const arac = modelGrubu.araclar[0];

      if (arac) {
        return {
          marka: markaGrubu.marka,
          model: modelGrubu.model,
          aracId: arac.id,
        };
      }
    }
  }

  return {
    marka: SIRALI_TANIMLI_MARKALAR[0],
    model: "",
    aracId: 0,
  };
}
