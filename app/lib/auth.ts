const OTURUM_SURESI_SANIYE = 60 * 60 * 24 * 7; // 7 gün
export const OTURUM_CEREZI = "ulastirma_oturum";

export type Oturum = {
  kullanici: string;
  exp: number;
};

function authSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AUTH_SECRET tanımlı değil. .env veya Vercel Environment Variables ekleyin.",
    );
  }
  return secret;
}

function guvenliEsit(a: string, b: string) {
  if (a.length !== b.length) return false;
  let fark = 0;
  for (let i = 0; i < a.length; i += 1) {
    fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return fark === 0;
}

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of u8) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function imzala(payload: string) {
  const key = await hmacKey();
  const imza = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return base64UrlEncode(imza);
}

export function yetkiliKullanicilar(): Array<{ kullanici: string; sifre: string }> {
  const ham = process.env.AUTH_USERS?.trim() ?? "";
  if (!ham) return [];

  return ham
    .split(",")
    .map((parca) => parca.trim())
    .filter(Boolean)
    .map((parca) => {
      const ayirac = parca.indexOf(":");
      if (ayirac <= 0) return null;
      return {
        kullanici: parca.slice(0, ayirac).trim(),
        sifre: parca.slice(ayirac + 1).trim(),
      };
    })
    .filter((kayit): kayit is { kullanici: string; sifre: string } => Boolean(kayit));
}

export function kullaniciDogrula(kullanici: string, sifre: string) {
  const kayit = yetkiliKullanicilar().find((k) =>
    guvenliEsit(k.kullanici, kullanici.trim()),
  );
  if (!kayit) return false;
  return guvenliEsit(kayit.sifre, sifre);
}

export async function oturumTokeniOlustur(kullanici: string) {
  const oturum: Oturum = {
    kullanici,
    exp: Math.floor(Date.now() / 1000) + OTURUM_SURESI_SANIYE,
  };
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(oturum)));
  const imza = await imzala(payload);
  return `${payload}.${imza}`;
}

export async function oturumTokeniniCoz(
  token: string | undefined | null,
): Promise<Oturum | null> {
  if (!token) return null;

  const [payload, imza] = token.split(".");
  if (!payload || !imza) return null;

  try {
    const beklenen = await imzala(payload);
    if (!guvenliEsit(imza, beklenen)) return null;

    const json = new TextDecoder().decode(base64UrlDecode(payload));
    const oturum = JSON.parse(json) as Oturum;

    if (!oturum?.kullanici || typeof oturum.exp !== "number") return null;
    if (oturum.exp < Math.floor(Date.now() / 1000)) return null;

    return oturum;
  } catch {
    return null;
  }
}

export function oturumCereziAyarlari(token: string) {
  return {
    name: OTURUM_CEREZI,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OTURUM_SURESI_SANIYE,
  };
}

export function oturumCereziSilAyarlari() {
  return {
    name: OTURUM_CEREZI,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
