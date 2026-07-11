-- AlterTable
ALTER TABLE "Arac" ADD COLUMN "bakimServisi" TEXT;

-- CreateTable
CREATE TABLE "AracParca" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aracId" INTEGER NOT NULL,
    "kategori" TEXT NOT NULL,
    "sonDegisimTarihi" DATETIME,
    "sonDegisimKm" INTEGER,
    "servisAdi" TEXT,
    "notlar" TEXT,
    CONSTRAINT "AracParca_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "Arac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AracParca_aracId_kategori_key" ON "AracParca"("aracId", "kategori");
