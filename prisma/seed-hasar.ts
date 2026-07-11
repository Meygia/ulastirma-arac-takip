import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const arac = await prisma.arac.findFirst({
    where: { plaka: "06ETS376" },
  });

  if (!arac) {
    console.log("06ETS376 plakalı araç bulunamadı, seed atlandı.");
    return;
  }

  const mevcut = await prisma.hasar.count({
    where: { aracId: arac.id },
  });

  if (mevcut > 0) {
    console.log("Hasar kayıtları zaten mevcut, seed atlandı.");
    return;
  }

  await prisma.hasar.createMany({
    data: [
      {
        aracId: arac.id,
        tur: "cizik",
        bolge: "Ön tampon",
        konum: "Kızılay, Ankara",
        tarih: new Date("2025-11-14"),
        aciklama: "Otopark direğine sürtünme",
        gorunumAcisi: 10,
        gorunumToleransi: 40,
        yuzdeX: 0.84,
        yuzdeY: 0.58,
      },
      {
        aracId: arac.id,
        tur: "gocuk",
        bolge: "Sol ön kapı",
        konum: "Söğütözü, Ankara",
        tarih: new Date("2026-01-08"),
        aciklama: "Yan park sırasında kapı darbesi",
        gorunumAcisi: 270,
        gorunumToleransi: 45,
        yuzdeX: 0.42,
        yuzdeY: 0.48,
      },
      {
        aracId: arac.id,
        tur: "kaza",
        bolge: "Arka sol çamurluk",
        konum: "Eskişehir Yolu, Ankara",
        tarih: new Date("2026-03-22"),
        aciklama: "Hafif arkadan çarpma",
        gorunumAcisi: 200,
        gorunumToleransi: 50,
        yuzdeX: 0.18,
        yuzdeY: 0.52,
      },
      {
        aracId: arac.id,
        tur: "boya",
        bolge: "Sağ ön jant",
        konum: "Ulus, Ankara",
        tarih: new Date("2026-05-03"),
        aciklama: "Kaldırım taşı sürtmesi",
        gorunumAcisi: 70,
        gorunumToleransi: 35,
        yuzdeX: 0.72,
        yuzdeY: 0.72,
      },
    ],
  });

  console.log("Hasar seed kayıtları eklendi.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
