// One-off/dev script: generates optimized copies of the source photos in docs/fotos
// into assets/img/gallery (full + thumbs) and optimized logo/favicon assets.
// Run with: node scripts/optimize-images.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'docs', 'fotos');
const OUT_DIR = path.join(ROOT, 'assets', 'img', 'gallery');
const THUMB_DIR = path.join(OUT_DIR, 'thumbs');
const LOGO_SRC = path.join(ROOT, 'docs', 'logo.jpg');
const IMG_DIR = path.join(ROOT, 'assets', 'img');

function slugify(name) {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter(f => /\.(jpe?g|png)$/i.test(f) && f.toLowerCase() !== 'logo.jpg');

  const manifest = [];
  for (const file of files) {
    const isCover = /^foto portada/i.test(file);
    const slug = isCover ? 'portada' : slugify(file);
    const fullOut = path.join(OUT_DIR, `${slug}.jpg`);
    const thumbOut = path.join(THUMB_DIR, `${slug}.jpg`);
    const srcPath = path.join(SRC_DIR, file);

    await sharp(srcPath)
      .rotate()
      .resize({ width: isCover ? 2400 : 1600, withoutEnlargement: true })
      .jpeg({ quality: isCover ? 82 : 78, mozjpeg: true })
      .toFile(fullOut);

    await sharp(srcPath)
      .rotate()
      .resize({ width: 480, withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toFile(thumbOut);

    const fullStat = fs.statSync(fullOut);
    const meta = await sharp(fullOut).metadata();
    manifest.push({
      id: slug,
      file: `assets/img/gallery/${slug}.jpg`,
      thumb: `assets/img/gallery/thumbs/${slug}.jpg`,
      width: meta.width,
      height: meta.height,
      cover: isCover,
      caption: ''
    });
    console.log(`OK ${file} -> ${slug}.jpg (${(fullStat.size / 1024).toFixed(0)} KB)`);
  }

  // Sort: cover first, then natural numeric order of "foto N"
  manifest.sort((a, b) => {
    if (a.cover) return -1;
    if (b.cover) return 1;
    const na = parseInt((a.id.match(/(\d+)/) || [0, 0])[1], 10);
    const nb = parseInt((b.id.match(/(\d+)/) || [0, 0])[1], 10);
    return na - nb;
  });

  fs.writeFileSync(
    path.join(ROOT, 'scripts', 'gallery-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`\nManifest generado con ${manifest.length} fotos -> scripts/gallery-manifest.json`);

  // Optimized logo (web-friendly PNG with transparent-ish white kept, and favicon sizes)
  await sharp(LOGO_SRC).resize({ width: 512 }).png({ quality: 90 }).toFile(path.join(IMG_DIR, 'logo.png'));
  await sharp(LOGO_SRC).resize(180, 180, { fit: 'cover' }).png().toFile(path.join(IMG_DIR, 'apple-touch-icon.png'));
  await sharp(LOGO_SRC).resize(32, 32, { fit: 'cover' }).png().toFile(path.join(IMG_DIR, 'favicon-32.png'));
  await sharp(LOGO_SRC).resize(16, 16, { fit: 'cover' }).png().toFile(path.join(IMG_DIR, 'favicon-16.png'));
  console.log('Logo y favicons generados en assets/img/');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
