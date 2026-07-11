import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const COROLLA_DIR = path.resolve("public/araclar/corolla");
const FG_THRESHOLD = 5;

function removeBlackBackground(data, width, height) {
  const isForeground = (index) => {
    const offset = index * 4;
    return (
      Math.max(data[offset], data[offset + 1], data[offset + 2]) > FG_THRESHOLD
    );
  };

  for (let x = 0; x < width; x++) {
    let top = -1;
    let bottom = -1;

    for (let y = 0; y < height; y++) {
      if (isForeground(y * width + x)) {
        top = y;
        break;
      }
    }

    for (let y = height - 1; y >= 0; y--) {
      if (isForeground(y * width + x)) {
        bottom = y;
        break;
      }
    }

    if (top === -1) {
      for (let y = 0; y < height; y++) {
        data[(y * width + x) * 4 + 3] = 0;
      }
      continue;
    }

    for (let y = 0; y < top; y++) {
      data[(y * width + x) * 4 + 3] = 0;
    }

    for (let y = bottom + 1; y < height; y++) {
      data[(y * width + x) * 4 + 3] = 0;
    }
  }

  for (let y = 0; y < height; y++) {
    let left = -1;
    let right = -1;

    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (data[index * 4 + 3] && isForeground(index)) {
        left = x;
        break;
      }
    }

    for (let x = width - 1; x >= 0; x--) {
      const index = y * width + x;
      if (data[index * 4 + 3] && isForeground(index)) {
        right = x;
        break;
      }
    }

    if (left === -1) {
      for (let x = 0; x < width; x++) {
        data[(y * width + x) * 4 + 3] = 0;
      }
      continue;
    }

    for (let x = 0; x < left; x++) {
      data[(y * width + x) * 4 + 3] = 0;
    }

    for (let x = right + 1; x < width; x++) {
      data[(y * width + x) * 4 + 3] = 0;
    }
  }

  for (let index = 0; index < width * height; index++) {
    if (data[index * 4 + 3] > 0) {
      data[index * 4 + 3] = 255;
    }
  }
}

async function processFrame(frameNumber) {
  const fileName = `${String(frameNumber).padStart(2, "0")}.png`;
  const sourcePath = path.join(COROLLA_DIR, fileName);
  const image = sharp(sourcePath);
  const metadata = await image.metadata();

  if (metadata.hasAlpha) {
    console.log(`${fileName}: zaten şeffaf, atlandı`);
    return;
  }

  const { data, info } = await image.ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const buffer = Buffer.from(data);
  removeBlackBackground(buffer, info.width, info.height);

  const tempPath = `${sourcePath}.tmp.png`;

  await sharp(buffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(tempPath);

  fs.renameSync(tempPath, sourcePath);

  console.log(`${fileName}: arka plan kaldırıldı (${info.width}x${info.height})`);
}

for (let frame = 1; frame <= 36; frame++) {
  await processFrame(frame);
}

console.log("Tamamlandı.");
