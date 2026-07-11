-- CreateTable
CREATE TABLE "AracBelgesi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aracId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "baslik" TEXT,
    "aciklama" TEXT,
    "dosyaAdi" TEXT NOT NULL,
    "dosyaYolu" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "boyut" INTEGER NOT NULL,
    "yuklenmeTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AracBelgesi_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "Arac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AracBelgesi_aracId_idx" ON "AracBelgesi"("aracId");
