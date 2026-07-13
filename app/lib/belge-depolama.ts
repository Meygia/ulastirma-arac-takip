import { randomUUID } from "crypto";
import { access, mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { del, head, put } from "@vercel/blob";

function dosyaAdiniGuvenliYap(dosyaAdi: string) {
  const temiz = dosyaAdi
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return temiz.slice(0, 120) || "belge";
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || null;
}

export function blobDepolamaAktifMi() {
  return Boolean(blobToken());
}

export function uzakBelgeYoluMu(dosyaYolu: string) {
  return /^https?:\/\//i.test(dosyaYolu);
}

function yerelTamYol(dosyaYolu: string) {
  const goreceli = dosyaYolu.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", ...goreceli.split("/"));
}

/**
 * Vercel'de yerel disk kalıcı değildir; production'da Blob zorunlu.
 * Yerelde token yoksa public/uploads altına yazar.
 */
export async function belgeDosyasiniKaydet(
  aracId: number,
  dosya: File,
): Promise<string> {
  const guvenliAd = dosyaAdiniGuvenliYap(dosya.name);
  const benzersizAd = `${randomUUID()}-${guvenliAd}`;
  const token = blobToken();

  if (token) {
    const blob = await put(`araclar/${aracId}/${benzersizAd}`, dosya, {
      access: "public",
      token,
      multipart: dosya.size > 4 * 1024 * 1024,
    });
    return blob.url;
  }

  if (process.env.VERCEL === "1") {
    throw new Error(
      "Dosya depolama yapılandırılmamış. Vercel'de BLOB_READ_WRITE_TOKEN ekleyin.",
    );
  }

  const goreceliYol = path.posix.join(
    "uploads",
    "araclar",
    String(aracId),
    benzersizAd,
  );
  const tamYol = path.join(process.cwd(), "public", ...goreceliYol.split("/"));

  await mkdir(path.dirname(tamYol), { recursive: true });
  await writeFile(tamYol, Buffer.from(await dosya.arrayBuffer()));

  return `/${goreceliYol}`;
}

export async function belgeDosyasiVarMi(dosyaYolu: string) {
  if (uzakBelgeYoluMu(dosyaYolu)) {
    const token = blobToken();
    if (!token) return false;
    try {
      await head(dosyaYolu, { token });
      return true;
    } catch {
      return false;
    }
  }

  try {
    await access(yerelTamYol(dosyaYolu));
    return true;
  } catch {
    return false;
  }
}

export async function belgeDosyasiniSil(dosyaYolu: string) {
  if (uzakBelgeYoluMu(dosyaYolu)) {
    const token = blobToken();
    if (!token) return;
    await del(dosyaYolu, { token }).catch(() => undefined);
    return;
  }

  await unlink(yerelTamYol(dosyaYolu)).catch(() => undefined);
}
