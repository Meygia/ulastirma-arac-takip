import type { AracParcaKaydi } from "@/app/lib/arac-parcalari";

export type AracDetay = {
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
  bakimKilometresi: number | null;
  bakimAciklamasi: string | null;
  lastikTuru: string | null;
  lastikTarihi: string | null;
  lastikDegisimYeri: string | null;
  lastikMuhafazaYeri: string | null;
  atananKisi: string | null;
  atananKisiTelefon: string | null;
  parcalar: AracParcaKaydi[];
};
