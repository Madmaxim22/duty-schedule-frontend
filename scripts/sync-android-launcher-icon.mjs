/**
 * Копирует выбранный вариант PWA-иконки в mipmap-* Android-оболочки (APK launcher).
 * Источник: public/icons/variants/generated/<variant-id>/icon-512-maskable.png
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const androidRes = path.join(frontendRoot, '..', 'duty-schedule-android', 'android', 'app', 'src', 'main', 'res');

const VARIANT_BACKGROUNDS = {
  'v1-calendar': '#4f46e5',
  'v2-teal': '#0d9488',
  'v3-dark': '#0f172a',
  'v4-shield': '#4f46e5',
  'v5-monogram': '#4f46e5',
  'v6-wasteland': '#3d2914',
  'v7-minimal': '#5c6b7a',
  'v8-material': '#4285f4',
  'v9-vice': '#c850c0',
  'v10-matrix': '#0a0f0a',
  'v11-wizard': '#2d1b4e',
};

const LEGACY_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

const FOREGROUND_SIZES = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function resizePng(source, size) {
  return sharp(source).resize(size, size).png().toBuffer();
}

async function updateBackgroundColor(bgHex) {
  const valuesPath = path.join(androidRes, 'values', 'ic_launcher_background.xml');
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${bgHex}</color>
</resources>
`;
  await fs.writeFile(valuesPath, xml);
}

async function main() {
  const variantId = process.argv[2] ?? 'v1-calendar';
  const bgHex = VARIANT_BACKGROUNDS[variantId];
  if (!bgHex) {
    console.error(`Неизвестный вариант: ${variantId}`);
    process.exit(1);
  }

  const source = path.join(
    frontendRoot,
    'public',
    'icons',
    'variants',
    'generated',
    variantId,
    'icon-512-maskable.png',
  );

  try {
    await fs.access(source);
  } catch {
    console.error(`Нет файла ${source}. Сначала: npm run icons:generate`);
    process.exit(1);
  }

  for (const { folder, size } of LEGACY_SIZES) {
    const dir = path.join(androidRes, folder);
    await fs.mkdir(dir, { recursive: true });
    const buf = await resizePng(source, size);
    await fs.writeFile(path.join(dir, 'ic_launcher.png'), buf);
    await fs.writeFile(path.join(dir, 'ic_launcher_round.png'), buf);
  }

  for (const { folder, size } of FOREGROUND_SIZES) {
    const dir = path.join(androidRes, folder);
    await fs.mkdir(dir, { recursive: true });
    const buf = await resizePng(source, size);
    await fs.writeFile(path.join(dir, 'ic_launcher_foreground.png'), buf);
  }

  await updateBackgroundColor(bgHex);

  console.log(`✓ APK launcher: ${variantId} → duty-schedule-android/android/app/src/main/res/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
