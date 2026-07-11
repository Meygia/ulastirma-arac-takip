export type AracRenk = {
  hex: string;
  vurgu: string;
  golge: string;
};

export type AracCizimOlculeri = {
  merkezX: number;
  zeminY: number;
  govdeX: number;
  govdeY: number;
  govdeGenisligi: number;
  govdeYuksekligi: number;
};

export function aracRenkBul(marka: string, model: string): AracRenk {
  const normalizedMarka = marka.trim().toLowerCase();
  const normalizedModel = model.trim().toLowerCase();
  const anahtar = `${normalizedMarka}-${normalizedModel}`;

  const renkler: Record<string, AracRenk> = {
    "renault-megane": {
      hex: "#5C6670",
      vurgu: "#8B95A0",
      golge: "#3E4650",
    },
    "audi-a6": {
      hex: "#2B2F33",
      vurgu: "#4B5563",
      golge: "#111827",
    },
    "audi-a8l": {
      hex: "#1A1D21",
      vurgu: "#374151",
      golge: "#0B0F14",
    },
    "toyota-corolla": {
      hex: "#4B5563",
      vurgu: "#6B7280",
      golge: "#374151",
    },
    "togg-t10x": {
      hex: "#111827",
      vurgu: "#374151",
      golge: "#030712",
    },
    "togg-t10f": {
      hex: "#111827",
      vurgu: "#374151",
      golge: "#030712",
    },
    "skoda-superb": {
      hex: "#18181B",
      vurgu: "#3F3F46",
      golge: "#09090B",
    },
    "ford-tourneo": {
      hex: "#1E3A5F",
      vurgu: "#2D5082",
      golge: "#122840",
    },
  };

  if (normalizedMarka === "renault" && normalizedModel.includes("megane")) {
    return renkler["renault-megane"];
  }

  if (normalizedMarka === "toyota" && normalizedModel.includes("corolla")) {
    return renkler["toyota-corolla"];
  }

  if (normalizedMarka === "skoda" && normalizedModel.includes("superb")) {
    return renkler["skoda-superb"];
  }

  if (normalizedMarka === "ford" && normalizedModel.includes("tourneo")) {
    return renkler["ford-tourneo"];
  }

  if (normalizedMarka === "togg") {
    const toggModel = normalizedModel.replace(/[\s-]/g, "");
    if (toggModel.includes("t10f")) {
      return renkler["togg-t10f"];
    }
    if (toggModel.includes("t10x")) {
      return renkler["togg-t10x"];
    }
  }

  if (normalizedMarka === "audi") {
    const audiModel = normalizedModel.replace(/[\s-]/g, "");
    if (audiModel.includes("a8l") || audiModel === "a8") {
      return renkler["audi-a8l"];
    }
    if (audiModel.includes("a6")) {
      return renkler["audi-a6"];
    }
  }

  return (
    renkler[anahtar] ?? {
      hex: "#64748B",
      vurgu: "#94A3B8",
      golge: "#475569",
    }
  );
}

export function aracCiz(
  ctx: CanvasRenderingContext2D,
  genislik: number,
  yukseklik: number,
  aciDerece: number,
  renk: AracRenk,
): AracCizimOlculeri {
  const aci = (aciDerece * Math.PI) / 180;
  const merkezX = genislik / 2;
  const zeminY = yukseklik * 0.78;
  const derinlik = Math.cos(aci);
  const yanGorunum = Math.abs(derinlik);
  const yon = Math.sin(aci);
  const govdeGenisligi = 250 + yanGorunum * 170;
  const govdeYuksekligi = 58;
  const kabinGenisligi = 190 + yanGorunum * 120;
  const kabinYuksekligi = 42;
  const tekerlekYaricapi = 28 + yanGorunum * 4;
  const camOpacity = 0.35 + yanGorunum * 0.25;

  ctx.clearRect(0, 0, genislik, yukseklik);

  const arkaPlan = ctx.createLinearGradient(0, 0, 0, yukseklik);
  arkaPlan.addColorStop(0, "#1e293b");
  arkaPlan.addColorStop(0.55, "#0f172a");
  arkaPlan.addColorStop(1, "#020617");
  ctx.fillStyle = arkaPlan;
  ctx.fillRect(0, 0, genislik, yukseklik);

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(
    merkezX,
    zeminY + 18,
    govdeGenisligi * 0.42,
    16 + yanGorunum * 8,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  const govdeGradient = ctx.createLinearGradient(
    merkezX - govdeGenisligi / 2,
    zeminY - 90,
    merkezX + govdeGenisligi / 2,
    zeminY,
  );
  govdeGradient.addColorStop(0, renk.vurgu);
  govdeGradient.addColorStop(0.45, renk.hex);
  govdeGradient.addColorStop(1, renk.golge);

  const govdeX = merkezX - govdeGenisligi / 2;
  const govdeY = zeminY - govdeYuksekligi - tekerlekYaricapi + 8;

  ctx.fillStyle = govdeGradient;
  ctx.beginPath();
  ctx.roundRect(govdeX, govdeY, govdeGenisligi, govdeYuksekligi, 16);
  ctx.fill();

  const kabinX = merkezX - kabinGenisligi / 2 + yon * 18;
  const kabinY = govdeY - kabinYuksekligi + 8;

  ctx.fillStyle = govdeGradient;
  ctx.beginPath();
  ctx.roundRect(kabinX, kabinY, kabinGenisligi, kabinYuksekligi, 14);
  ctx.fill();

  ctx.fillStyle = `rgba(120, 140, 160, ${camOpacity})`;
  ctx.beginPath();
  ctx.roundRect(
    kabinX + kabinGenisligi * 0.12,
    kabinY + 8,
    kabinGenisligi * 0.34,
    kabinYuksekligi - 16,
    8,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(
    kabinX + kabinGenisligi * 0.52,
    kabinY + 8,
    kabinGenisligi * 0.34,
    kabinYuksekligi - 16,
    8,
  );
  ctx.fill();

  if (yon > 0.15) {
    ctx.fillStyle = "#fff4d6";
    ctx.beginPath();
    ctx.ellipse(
      govdeX + govdeGenisligi - 12,
      govdeY + govdeYuksekligi * 0.55,
      8,
      5,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  } else if (yon < -0.15) {
    ctx.fillStyle = "#991b1b";
    ctx.beginPath();
    ctx.roundRect(govdeX + 8, govdeY + govdeYuksekligi * 0.45, 10, 8, 2);
    ctx.fill();
  }

  const tekerlekMerkezleri = [
    govdeX + govdeGenisligi * 0.24,
    govdeX + govdeGenisligi * 0.76,
  ];

  for (const tekerlekX of tekerlekMerkezleri) {
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.arc(tekerlekX, zeminY - 2, tekerlekYaricapi, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(tekerlekX, zeminY - 2, tekerlekYaricapi * 0.62, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.beginPath();
  ctx.ellipse(
    govdeX + govdeGenisligi * 0.22,
    govdeY + 12,
    govdeGenisligi * 0.18,
    8,
    -0.2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  return {
    merkezX,
    zeminY,
    govdeX,
    govdeY,
    govdeGenisligi,
    govdeYuksekligi,
  };
}
