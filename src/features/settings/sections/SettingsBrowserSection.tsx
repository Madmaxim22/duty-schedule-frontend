import { useState } from 'react';
import { IconPicker } from '@/features/settings/IconPicker';
import { PwaInstallSection } from '@/features/settings/PwaInstallSection';
import {
  applyPwaIcon,
  loadPwaIcon,
  savePwaIcon,
  type PwaIconId,
} from '@/features/settings/pwa-icon';
import { SettingsSection } from './SettingsSection';

export function SettingsBrowserSection() {
  const [pwaIcon, setPwaIcon] = useState<PwaIconId>(() => loadPwaIcon());

  function handlePwaIconChange(next: PwaIconId) {
    setPwaIcon(next);
    savePwaIcon(next);
    applyPwaIcon(next);
  }

  return (
    <SettingsSection
      titleId="settings-browser-title"
      title="Браузер"
      className="settings-page__section--browser"
    >
      <p className="settings-page__section-hint">
        Установка PWA и иконка ярлыка при «Добавить на экран». Сохраняется на этом устройстве; для
        смены уже установленного ярлыка переустановите приложение.
      </p>
      <IconPicker iconId={pwaIcon} onChange={handlePwaIconChange} />
      <PwaInstallSection />
    </SettingsSection>
  );
}
