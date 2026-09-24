// One-off script: produces a transparent-background version of the school
// crest (docs/logo.jpg) by flood-filling the light gray/white background
// from the image edges inward, stopping at the shield's outline. Used for
// a large emblem placed directly over photos (hero section) without an
// artificial white card behind it.
// Run with: node scripts/make-logo-emblem.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "docs", "logo.jpg");
const OUT = path.join(ROOT, "assets", "img", "logo-emblem.png");
const WIDTH = 700;
const THRESHOLD = 22; // max per-step color distance to keep flood-filling
const SAT_LIMIT = 40; // a neighbor can only be background if it's fairly achromatic (gray/white),
// which stops the fill from leaking into the shield's saturated blue/gold/copper areas
// even where smooth gradient shading would otherwise bridge the color-distance check.

function colorDist(data, i, j) {
  const dr = data[i] - data[j];
  const dg = data[i + 1] - data[j + 1];
  const db = data[i + 2] - data[j + 2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function chroma(data, i) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  return Math.max(r, g, b) - Math.min(r, g, b);
}

async function main() {
  const { data, info } = await sharp(SRC)
    .resize({ width: WIDTH })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  const alphaMask = new Uint8Array(width * height).fill(255);
  const visited = new Uint8Array(width * height);
  const queue = [];

  const pushIfNew = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (!visited[p]) {
      visited[p] = 1;
      queue.push(p);
    }
  };

  for (let x = 0; x < width; x++) {
    pushIfNew(x, 0);
    pushIfNew(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushIfNew(0, y);
    pushIfNew(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const p = queue[head++];
    alphaMask[p] = 0;
    const x = p % width;
    const y = (p / width) | 0;
    const i = p * channels;

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const np = ny * width + nx;
      if (visited[np]) continue;
      const j = np * channels;
      if (chroma(data, j) <= SAT_LIMIT && colorDist(data, i, j) <= THRESHOLD) {
        visited[np] = 1;
        queue.push(np);
      }
    }
  }

  const rgbBuffer = Buffer.alloc(width * height * 3);
  for (let p = 0; p < width * height; p++) {
    rgbBuffer[p * 3] = data[p * channels];
    rgbBuffer[p * 3 + 1] = data[p * channels + 1];
    rgbBuffer[p * 3 + 2] = data[p * channels + 2];
  }

  const alphaBlurred = await sharp(Buffer.from(alphaMask), {
    raw: { width, height, channels: 1 },
  })
    .blur(1.1)
    .toColourspace("b-w") // sin esto, sharp expande el buffer raw de 1 canal a 3 (RGB) al salir
    .raw()
    .toBuffer();

  await sharp(rgbBuffer, { raw: { width, height, channels: 3 } })
    .joinChannel(alphaBlurred, { raw: { width, height, channels: 1 } })
    .png()
    .toFile(OUT);

  console.log(`Emblema con fondo transparente generado: ${path.relative(ROOT, OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
