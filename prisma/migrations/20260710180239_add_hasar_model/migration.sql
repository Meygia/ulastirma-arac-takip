-- CreateTable
CREATE TABLE "Hasar" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "aracId" INTEGER NOT NULL,
    "tur" TEXT NOT NULL,
    "bolge" TEXT NOT NULL,
    "konum" TEXT NOT NULL,
    "tarih" DATETIME NOT NULL,
    "aciklama" TEXT NOT NULL,
    "gorunumAcisi" REAL NOT NULL,
    "gorunumToleransi" REAL NOT NULL DEFAULT 40,
    "yuzdeX" REAL NOT NULL,
    "yuzdeY" REAL NOT NULL,
    "olusturulmaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellenmeTarihi" DATETIME NOT NULL,
    CONSTRAINT "Hasar_aracId_fkey" FOREIGN KEY ("aracId") REFERENCES "Arac" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
