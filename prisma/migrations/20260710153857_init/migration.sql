-- CreateTable
CREATE TABLE "Arac" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plaka" TEXT NOT NULL,
    "marka" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yil" INTEGER NOT NULL,
    "sasiNo" TEXT,
    "kilometre" INTEGER NOT NULL DEFAULT 0,
    "aktifGorevdeMi" BOOLEAN NOT NULL DEFAULT false,
    "bakimTarihi" DATETIME,
    "olusturulmaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellenmeTarihi" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Arac_plaka_key" ON "Arac"("plaka");

-- CreateIndex
CREATE UNIQUE INDEX "Arac_sasiNo_key" ON "Arac"("sasiNo");
