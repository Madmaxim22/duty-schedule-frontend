export type PwaIconId =
  | 'v1-calendar'
  | 'v2-teal'
  | 'v3-dark'
  | 'v4-shield'
  | 'v5-monogram'
  | 'v6-wasteland'
  | 'v7-minimal'
  | 'v8-material'
  | 'v9-vice'
  | 'v10-matrix'
  | 'v11-wizard';

export const PWA_ICON_STORAGE_KEY = 'duty-schedule-pwa-icon';

export const DEFAULT_PWA_ICON: PwaIconId = 'v1-calendar';

const VALID_ICONS: PwaIconId[] = [
  'v1-calendar',
  'v2-teal',
  'v3-dark',
  'v4-shield',
  'v5-monogram',
  'v6-wasteland',
  'v7-minimal',
  'v8-material',
  'v9-vice',
  'v10-matrix',
  'v11-wizard',
];

export type PwaIconOption = {
  id: PwaIconId;
  label: string;
  description: string;
};

export const PWA_ICON_OPTIONS: PwaIconOption[] = [
  { id: 'v1-calendar', label: 'Календарь', description: 'Сетка на indigo' },
  { id: 'v2-teal', label: 'Бирюза', description: 'Контурный календарь' },
  { id: 'v3-dark', label: 'Тёмная', description: 'Тёмный фон' },
  { id: 'v4-shield', label: 'Щит', description: 'Ответственность' },
  { id: 'v5-monogram', label: '«Д»', description: 'Монограмма' },
  { id: 'v6-wasteland', label: 'Пустошь', description: 'Постапокалипсис' },
  { id: 'v7-minimal', label: 'Минимал', description: 'Стиль iOS' },
  { id: 'v8-material', label: 'Material', description: 'Стиль Google' },
  { id: 'v9-vice', label: 'GTA', description: 'San Andreas, halftone' },
  { id: 'v10-matrix', label: 'Матрица', description: 'Неон, digital rain' },
  { id: 'v11-wizard', label: 'Магия', description: 'Пергамент и золото' },
];

export const PWA_ICON_THEME_COLOR: Record<PwaIconId, string> = {
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

export function isPwaIconId(value: string | null): value is PwaIconId {
  return value !== null && VALID_ICONS.includes(value as PwaIconId);
}

export function pwaIconBasePath(id: PwaIconId): string {
  return `/icons/variants/generated/${id}`;
}

export function loadPwaIcon(): PwaIconId {
  try {
    const stored = localStorage.getItem(PWA_ICON_STORAGE_KEY);
    if (isPwaIconId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_PWA_ICON;
}

export function savePwaIcon(id: PwaIconId) {
  try {
    localStorage.setItem(PWA_ICON_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

function upsertLink(rel: string, href: string, type?: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
  if (type) link.type = type;
}

export function applyPwaIcon(id: PwaIconId) {
  const base = pwaIconBasePath(id);
  upsertLink('manifest', `/manifests/${id}.webmanifest`);
  upsertLink('icon', `${base}/icon-192.png`, 'image/png');
  upsertLink('apple-touch-icon', `${base}/apple-touch-icon.png`);

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = PWA_ICON_THEME_COLOR[id];
}

export function initPwaIconFromStorage() {
  applyPwaIcon(loadPwaIcon());
}
