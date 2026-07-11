-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Arac" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plaka" TEXT NOT NULL,
    "marka" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yil" INTEGER NOT NULL,
    "sasiNo" TEXT,
    "kilometre" INTEGER NOT NULL DEFAULT 0,
    "aktifGorevdeMi" BOOLEAN NOT NULL DEFAULT false,
    "bakimdaMi" BOOLEAN NOT NULL DEFAULT false,
    "bakimTarihi" DATETIME,
    "bakimServisi" TEXT,
    "atananKisi" TEXT,
    "olusturulmaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellenmeTarihi" DATETIME NOT NULL
);
INSERT INTO "new_Arac" ("aktifGorevdeMi", "atananKisi", "bakimServisi", "bakimTarihi", "guncellenmeTarihi", "id", "kilometre", "marka", "model", "olusturulmaTarihi", "plaka", "sasiNo", "yil") SELECT "aktifGorevdeMi", "atananKisi", "bakimServisi", "bakimTarihi", "guncellenmeTarihi", "id", "kilometre", "marka", "model", "olusturulmaTarihi", "plaka", "sasiNo", "yil" FROM "Arac";
DROP TABLE "Arac";
ALTER TABLE "new_Arac" RENAME TO "Arac";
CREATE UNIQUE INDEX "Arac_plaka_key" ON "Arac"("plaka");
CREATE UNIQUE INDEX "Arac_sasiNo_key" ON "Arac"("sasiNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
