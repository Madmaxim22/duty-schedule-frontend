import { useState } from 'react';
import { ThemePicker } from '@/features/settings/ThemePicker';
import { applyTheme, loadTheme, saveTheme, type AppTheme } from '@/features/settings/theme';
import { SettingsSection } from './SettingsSection';

export function SettingsAppearanceSection() {
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());

  function handleThemeChange(next: AppTheme) {
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  }

  return (
    <SettingsSection titleId="settings-appearance-title" title="Оформление">
      <p className="settings-page__section-hint">
        Цветовая палитра интерфейса. Сохраняется на этом устройстве.
      </p>
      <ThemePicker theme={theme} onChange={handleThemeChange} />
    </SettingsSection>
  );
}
