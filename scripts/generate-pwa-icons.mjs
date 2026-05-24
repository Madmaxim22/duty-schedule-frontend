/**
 * Экспорт PNG для «Добавить на экран» (Android + iOS) из SVG в public/icons/variants/.
 * iOS: 180×180 (apple-touch-icon)
 * Android: 192×192, 512×512 (+ maskable 512 с safe zone ~66%)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const variantsDir = path.join(root, 'public', 'icons', 'variants');
const outBase = path.join(variantsDir, 'generated');

const VARIANTS = [
  { id: 'v1-calendar', file: 'v1-calendar.svg', maskableBg: '#4f46e5', themeColor: '#4f46e5' },
  { id: 'v2-teal', file: 'v2-teal.svg', maskableBg: '#0d9488', themeColor: '#0d9488' },
  { id: 'v3-dark', file: 'v3-dark.svg', maskableBg: '#0f172a', themeColor: '#0f172a' },
  { id: 'v4-shield', file: 'v4-shield.svg', maskableBg: '#4f46e5', themeColor: '#4f46e5' },
  { id: 'v5-monogram', file: 'v5-monogram.svg', maskableBg: '#4f46e5', themeColor: '#4f46e5' },
];

const manifestsDir = path.join(root, 'public', 'manifests');

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
      {
        src: `${base}/icon-192.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}/icon-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `${base}/icon-512-maskable.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}

const SIZES = [
  { name: 'apple-touch-icon', size: 180, note: 'iOS' },
  { name: 'icon-192', size: 192, note: 'Android' },
  { name: 'icon-512', size: 512, note: 'Android' },
];

async function renderPng(svgPath, size) {
  return sharp(svgPath).resize(size, size).png().toBuffer();
}

/** Maskable: важный контент в центральных ~66% (Android adaptive icon). */
async function renderMaskable512(svgPath, bgHex) {
  const size = 512;
  const inner = Math.round(size * 0.66);
  const icon = await sharp(svgPath).resize(inner, inner).png().toBuffer();
  const pad = Math.round((size - inner) / 2);
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bgHex,
    },
  })
    .composite([{ input: icon, left: pad, top: pad }])
    .png()
    .toBuffer();
}

async function main() {
  await fs.mkdir(outBase, { recursive: true });
  await fs.mkdir(manifestsDir, { recursive: true });

  for (const variant of VARIANTS) {
    const svgPath = path.join(variantsDir, variant.file);
    const outDir = path.join(outBase, variant.id);
    await fs.mkdir(outDir, { recursive: true });

    for (const { name, size } of SIZES) {
      const buf = await renderPng(svgPath, size);
      await fs.writeFile(path.join(outDir, `${name}.png`), buf);
    }

    const maskable = await renderMaskable512(svgPath, variant.maskableBg);
    await fs.writeFile(path.join(outDir, 'icon-512-maskable.png'), maskable);

    const manifest = buildManifest(variant);
    await fs.writeFile(
      path.join(manifestsDir, `${variant.id}.webmanifest`),
      `${JSON.stringify(manifest, null, 2)}\n`,
    );

    console.log(`✓ ${variant.id}`);
  }

  const defaultManifest = buildManifest(VARIANTS[0]);
  await fs.writeFile(
    path.join(root, 'public', 'manifest.webmanifest'),
    `${JSON.stringify(defaultManifest, null, 2)}\n`,
  );

  console.log(`\nГотово: ${path.relative(root, outBase)}/<variant>/`);
  console.log(`Манифесты: ${path.relative(root, manifestsDir)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
