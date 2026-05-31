# Варианты иконок PWA («Добавить на экран»)

## Варианты

| ID | Файл | Описание |
|----|------|----------|
| **v1-calendar** | `v1-calendar.svg` | Календарь-сетка на indigo (как в production) |
| **v2-teal** | `v2-teal.svg` | Бирюзовый градиент, контурный календарь |
| **v3-dark** | `v3-dark.svg` | Тёмный фон, акцент на активном дне |
| **v4-shield** | `v4-shield.svg` | Щит + мини-календарь + галочка |
| **v5-monogram** | `v5-monogram.svg` | Буква «Д» (Дежурства) |
| **v6-wasteland** | `v6-wasteland.svg` | Постапокалипсис, ржавчина |
| **v7-minimal** | `v7-minimal.svg` | Минимализм в духе iOS |
| **v8-material** | `v8-material.svg` | Material / 4 цвета Google |
| **v9-vice** | `sources/v9-vice-source.png` | GTA / San Andreas (растр) |
| **v10-matrix** | `sources/v10-matrix-source.png` | Матрица, неон (растр) |
| **v11-wizard** | `sources/v11-wizard-source.png` | Магия, пергамент/золото (растр) |

## Размеры по платформам

| Файл | Размер | Платформа |
|------|--------|-----------|
| `apple-touch-icon.png` | 180×180 | **iOS** — «На экран Домой» |
| `icon-192.png` | 192×192 | **Android** — manifest |
| `icon-512.png` | 512×512 | **Android** — splash / install |
| `icon-512-maskable.png` | 512×512 | **Android** — adaptive icon (safe zone 66%) |

## Генерация PNG

```bash
cd duty-schedule-frontend
npm install
npm run icons:generate
```

Растровые v9–v11 (после замены `sources/*-source.png`):

```bash
npm run icons:import-raster
```

Результат: `public/icons/variants/generated/<variant-id>/`.

Превью в браузере (при запущенном `npm run dev`):

`http://localhost:5173/icons/variants/preview.html`

## Подключение выбранного варианта

1. Скопировать из `generated/vX-.../` в `public/icons/`:
   - `icon-192.png`, `icon-512.png`
   - для iOS добавить в `index.html`:
     ```html
     <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
     ```
2. В `manifest.webmanifest` при необходимости добавить maskable:
   ```json
   {
     "src": "/icons/icon-512-maskable.png",
     "sizes": "512x512",
     "type": "image/png",
     "purpose": "maskable"
   }
   ```
