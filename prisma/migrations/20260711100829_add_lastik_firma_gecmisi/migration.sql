-- AlterTable
ALTER TABLE "AracBilgiGecmisi" ADD COLUMN "lastikTuru" TEXT;

-- CreateTable
CREATE TABLE "MarkaModelFirmaGecmisi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "marka" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tur" TEXT NOT NULL,
    "firmaAdi" TEXT,
    "telefon" TEXT,
    "kayitTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MarkaModelFirmaGecmisi_marka_model_tur_idx" ON "MarkaModelFirmaGecmisi"("marka", "model", "tur");
