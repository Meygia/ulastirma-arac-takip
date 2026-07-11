-- AlterTable
ALTER TABLE "Arac" ADD COLUMN "bakimAciklamasi" TEXT;
ALTER TABLE "Arac" ADD COLUMN "bakimKilometresi" INTEGER;

-- CreateTable
CREATE TABLE "AracBilgiGecmisi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aracId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "tarih" DATETIME,
    "kilometre" INTEGER,
    "servisAdi" TEXT,
    "aciklama" TEXT,
    "kayitTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AracBilgiGecmisi_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "Arac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AracBilgiGecmisi_aracId_tur_idx" ON "AracBilgiGecmisi"("aracId", "tur");
