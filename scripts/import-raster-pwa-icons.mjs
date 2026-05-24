/**
 * Импорт растровых исходников (AI/референс) в public/icons/variants/generated/<id>/
 * Использование: node scripts/import-raster-pwa-icons.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sourcesDir = path.join(root, 'public', 'icons', 'variants', 'sources');
const outBase = path.join(root, 'public', 'icons', 'variants', 'generated');
const manifestsDir = path.join(root, 'public', 'manifests');

const RASTER_VARIANTS = [
  { id: 'v9-vice', file: 'v9-vice-source.png', maskableBg: '#e8890c', themeColor: '#e8890c' },
  { id: 'v10-matrix', file: 'v10-matrix-source.png', maskableBg: '#0a0f0a', themeColor: '#0a0f0a' },
  { id: 'v11-wizard', file: 'v11-wizard-source.png', maskableBg: '#2d1b4e', themeColor: '#2d1b4e' },
];

const SIZES = [
  { name: 'apple-touch-icon', size: 180 },
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
];

function buildManifest(variant) {
  const base = `/icons/variants/generated/${variant.id}`;
  return {
    name: 'График дежурств',
    short_name: 'Дежурства',
    description: 'Расписание дежурств',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: variant.themeColor,
    lang: 'ru',
    icons: [
      { src: `${base}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${base}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: `${base}/icon-512-maskable.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

async function renderMaskable512(srcPath, bgHex) {
  const size = 512;
  const inner = Math.round(size * 0.66);
  const icon = await sharp(srcPath).resize(inner, inner).png().toBuffer();
  const pad = Math.round((size - inner) / 2);
  return sharp({
    create: { width: size, height: size, channels: 4, background: bgHex },
  })
    .composite([{ input: icon, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function main() {
  await fs.mkdir(sourcesDir, { recursive: true });
  await fs.mkdir(manifestsDir, { recursive: true });

  for (const variant of RASTER_VARIANTS) {
    const srcPath = path.join(sourcesDir, variant.file);
    try {
      await fs.access(srcPath);
    } catch {
      console.error(`Нет файла: ${srcPath}`);
      process.exit(1);
    }

    const outDir = path.join(outBase, variant.id);
    await fs.mkdir(outDir, { recursive: true });

    for (const { name, size } of SIZES) {
      await sharp(srcPath)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(path.join(outDir, `${name}.png`));
    }

    const maskable = await renderMaskable512(srcPath, variant.maskableBg);
    await fs.writeFile(path.join(outDir, 'icon-512-maskable.png'), maskable);

    await fs.writeFile(
      path.join(manifestsDir, `${variant.id}.webmanifest`),
      `${JSON.stringify(buildManifest(variant), null, 2)}\n`,
    );

    console.log(`✓ ${variant.id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
