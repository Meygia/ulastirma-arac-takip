import type { HasarTuru } from "@/app/lib/arac-hasarlari";

type SimgeSecenekleri = {
  vurgulu?: boolean;
  onizleme?: boolean;
};

function simgeCiz(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tur: HasarTuru,
  renk: string,
  yaricap: number,
  { vurgulu = false, onizleme = false }: SimgeSecenekleri = {},
) {
  const disHalka = yaricap + (vurgulu ? 9 : onizleme ? 7 : 5);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, disHalka, 0, Math.PI * 2);
  ctx.fillStyle = vurgulu ? `${renk}55` : onizleme ? `${renk}44` : `${renk}30`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, yaricap, 0, Math.PI * 2);
  ctx.fillStyle = renk;
  ctx.fill();
  ctx.lineWidth = vurgulu ? 2.5 : 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 1.75;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const s = yaricap * 0.52;

  switch (tur) {
    case "kaza": {
      for (let i = 0; i < 8; i += 1) {
        const aci = (Math.PI / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(aci) * s * 0.35, y + Math.sin(aci) * s * 0.35);
        ctx.lineTo(x + Math.cos(aci) * s, y + Math.sin(aci) * s);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, s * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "cizik": {
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x - s * 0.85 + i * 3, y + s * 0.75);
        ctx.lineTo(x + s * 0.85 + i * 3, y - s * 0.75);
        ctx.stroke();
      }
      break;
    }
    case "gocuk": {
      ctx.beginPath();
      ctx.arc(x, y + s * 0.15, s * 0.75, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.55, y + s * 0.05);
      ctx.lineTo(x + s * 0.55, y + s * 0.05);
      ctx.stroke();
      break;
    }
    case "boya": {
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.95);
      ctx.bezierCurveTo(
        x + s * 0.55,
        y - s * 0.55,
        x + s * 0.55,
        y + s * 0.15,
        x,
        y + s * 0.85,
      );
      ctx.bezierCurveTo(
        x - s * 0.55,
        y + s * 0.15,
        x - s * 0.55,
        y - s * 0.55,
        x,
        y - s * 0.95,
      );
      ctx.fill();
      break;
    }
    case "degisen": {
      ctx.beginPath();
      ctx.arc(x, y, s * 0.72, Math.PI * 0.15, Math.PI * 1.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - s * 0.55, y - s * 0.35);
      ctx.lineTo(x - s * 0.85, y - s * 0.55);
      ctx.lineTo(x - s * 0.55, y - s * 0.75);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, s * 0.72, Math.PI * 1.15, Math.PI * 2.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.55, y + s * 0.35);
      ctx.lineTo(x + s * 0.85, y + s * 0.55);
      ctx.lineTo(x + s * 0.55, y + s * 0.75);
      ctx.fill();
      break;
    }
    case "lokal_boyali": {
      ctx.beginPath();
      ctx.arc(x, y, s * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, s * 0.78, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.78);
      ctx.lineTo(x, y + s * 0.78);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

export function hasarIsaretSimgesiCiz(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tur: HasarTuru,
  renk: string,
  secili: boolean,
  vurgulu: boolean,
) {
  const yaricap = secili || vurgulu ? 15 : 13;
  simgeCiz(ctx, x, y, tur, renk, yaricap, { vurgulu: secili || vurgulu });
}

export function hasarOnizlemeSimgesiCiz(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tur: HasarTuru,
  renk: string,
) {
  simgeCiz(ctx, x, y, tur, renk, 14, { onizleme: true });
}

export function hasarLegendSimgesiCiz(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tur: HasarTuru,
  renk: string,
) {
  simgeCiz(ctx, x, y, tur, renk, 8, {});
}
