export type AppTheme = 'indigo' | 'teal' | 'cyan' | 'violet' | 'forest' | 'dark';

export const THEME_STORAGE_KEY = 'duty-schedule-theme';

const VALID_THEMES: AppTheme[] = ['indigo', 'teal', 'cyan', 'violet', 'forest', 'dark'];

export const DEFAULT_THEME: AppTheme = 'indigo';

export type ThemeOption = {
  id: AppTheme;
  label: string;
  accent: string;
  primary: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'indigo', label: 'Индиго', accent: '#4f46e5', primary: '#1e293b' },
  { id: 'teal', label: 'Бирюза', accent: '#0d9488', primary: '#134e4a' },
  { id: 'cyan', label: 'Циан', accent: '#0891b2', primary: '#18181b' },
  { id: 'violet', label: 'Фиолет', accent: '#7c3aed', primary: '#4c1d95' },
  { id: 'forest', label: 'Лес', accent: '#d97706', primary: '#14532d' },
  { id: 'dark', label: 'Тёмная', accent: '#38bdf8', primary: '#e2e8f0' },
];

const THEME_META_COLOR: Record<AppTheme, string> = {
  indigo: '#4f46e5',
  teal: '#0d9488',
  cyan: '#0891b2',
  violet: '#7c3aed',
  forest: '#d97706',
  dark: '#0f1419',
};

export function isAppTheme(value: string | null): value is AppTheme {
  return value !== null && VALID_THEMES.includes(value as AppTheme);
}

export function loadTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isAppTheme(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function saveTheme(theme: AppTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_META_COLOR[theme];
}

/** Inline script in index.html — keep VALID_THEMES in sync */
export function initThemeFromStorage() {
  applyTheme(loadTheme());
}
