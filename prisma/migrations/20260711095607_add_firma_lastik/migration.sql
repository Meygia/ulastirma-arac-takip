-- AlterTable
ALTER TABLE "Arac" ADD COLUMN "lastikDegisimYeri" TEXT;
ALTER TABLE "Arac" ADD COLUMN "lastikMuhafazaYeri" TEXT;
ALTER TABLE "Arac" ADD COLUMN "lastikTuru" TEXT;

-- CreateTable
CREATE TABLE "MarkaModelFirma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marka" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tur" TEXT NOT NULL,
    "firmaAdi" TEXT,
    "telefon" TEXT,
    "guncellenmeTarihi" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "MarkaModelFirma_marka_model_idx" ON "MarkaModelFirma"("marka", "model");

-- CreateIndex
CREATE UNIQUE INDEX "MarkaModelFirma_marka_model_tur_key" ON "MarkaModelFirma"("marka", "model", "tur");
