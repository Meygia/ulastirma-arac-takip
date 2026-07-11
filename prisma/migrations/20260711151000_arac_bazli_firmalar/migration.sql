-- CreateTable
CREATE TABLE "AracFirma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aracId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "firmaAdi" TEXT,
    "telefon" TEXT,
    "kayitTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AracFirma_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "Arac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AracFirma_aracId_tur_idx" ON "AracFirma"("aracId", "tur");

-- Eski marka+model kayıtlarını eşleşen her araca kopyala
INSERT INTO "AracFirma" ("aracId", "tur", "firmaAdi", "telefon", "kayitTarihi")
SELECT a."id", g."tur", g."firmaAdi", g."telefon", g."kayitTarihi"
FROM "MarkaModelFirmaGecmisi" g
INNER JOIN "Arac" a ON LOWER(a."marka") = g."marka" AND LOWER(a."model") = g."model";

INSERT INTO "AracFirma" ("aracId", "tur", "firmaAdi", "telefon", "kayitTarihi")
SELECT a."id", f."tur", f."firmaAdi", f."telefon", f."guncellenmeTarihi"
FROM "MarkaModelFirma" f
INNER JOIN "Arac" a ON LOWER(a."marka") = f."marka" AND LOWER(a."model") = f."model";

DROP TABLE "MarkaModelFirmaGecmisi";
DROP TABLE "MarkaModelFirma";
