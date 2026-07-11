-- Mevcut bakım kayıtlarını geçmişe taşı
INSERT INTO "AracBilgiGecmisi" ("aracId", "tur", "tarih", "kilometre", "servisAdi", "aciklama", "kayitTarihi")
SELECT
  "id",
  'bakim',
  "bakimTarihi",
  "bakimKilometresi",
  "bakimServisi",
  "bakimAciklamasi",
  COALESCE("guncellenmeTarihi", CURRENT_TIMESTAMP)
FROM "Arac"
WHERE
  "bakimTarihi" IS NOT NULL
  OR "bakimKilometresi" IS NOT NULL
  OR TRIM(COALESCE("bakimServisi", '')) != ''
  OR TRIM(COALESCE("bakimAciklamasi", '')) != '';

UPDATE "Arac"
SET
  "bakimTarihi" = NULL,
  "bakimServisi" = NULL,
  "bakimKilometresi" = NULL,
  "bakimAciklamasi" = NULL
WHERE
  "bakimTarihi" IS NOT NULL
  OR "bakimKilometresi" IS NOT NULL
  OR TRIM(COALESCE("bakimServisi", '')) != ''
  OR TRIM(COALESCE("bakimAciklamasi", '')) != '';

-- Mevcut lastik kayıtlarını geçmişe taşı
INSERT INTO "AracBilgiGecmisi" ("aracId", "tur", "tarih", "servisAdi", "aciklama", "lastikTuru", "kayitTarihi")
SELECT
  "id",
  'lastik',
  "lastikTarihi",
  "lastikDegisimYeri",
  "lastikMuhafazaYeri",
  "lastikTuru",
  COALESCE("guncellenmeTarihi", CURRENT_TIMESTAMP)
FROM "Arac"
WHERE
  "lastikTuru" IS NOT NULL
  OR "lastikTarihi" IS NOT NULL
  OR TRIM(COALESCE("lastikDegisimYeri", '')) != ''
  OR TRIM(COALESCE("lastikMuhafazaYeri", '')) != '';

UPDATE "Arac"
SET
  "lastikTuru" = NULL,
  "lastikTarihi" = NULL,
  "lastikDegisimYeri" = NULL,
  "lastikMuhafazaYeri" = NULL
WHERE
  "lastikTuru" IS NOT NULL
  OR "lastikTarihi" IS NOT NULL
  OR TRIM(COALESCE("lastikDegisimYeri", '')) != ''
  OR TRIM(COALESCE("lastikMuhafazaYeri", '')) != '';

-- Mevcut parça kayıtlarını geçmişe taşı
INSERT INTO "AracBilgiGecmisi" ("aracId", "tur", "tarih", "kilometre", "servisAdi", "aciklama", "kayitTarihi")
SELECT
  "aracId",
  "kategori",
  "sonDegisimTarihi",
  "sonDegisimKm",
  "servisAdi",
  "notlar",
  CURRENT_TIMESTAMP
FROM "AracParca"
WHERE
  "sonDegisimTarihi" IS NOT NULL
  OR "sonDegisimKm" IS NOT NULL
  OR TRIM(COALESCE("servisAdi", '')) != ''
  OR TRIM(COALESCE("notlar", '')) != '';

DELETE FROM "AracParca"
WHERE
  "sonDegisimTarihi" IS NOT NULL
  OR "sonDegisimKm" IS NOT NULL
  OR TRIM(COALESCE("servisAdi", '')) != ''
  OR TRIM(COALESCE("notlar", '')) != '';

-- Aktif firma kayıtlarını listeye taşı
INSERT INTO "MarkaModelFirmaGecmisi" ("marka", "model", "tur", "firmaAdi", "telefon", "kayitTarihi")
SELECT
  "marka",
  "model",
  "tur",
  "firmaAdi",
  "telefon",
  "guncellenmeTarihi"
FROM "MarkaModelFirma"
WHERE
  TRIM(COALESCE("firmaAdi", '')) != ''
  OR TRIM(COALESCE("telefon", '')) != '';

DELETE FROM "MarkaModelFirma";
