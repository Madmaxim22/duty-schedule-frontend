import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { ThemePicker } from '@/features/settings/ThemePicker';
import {
  applyTheme,
  loadTheme,
  saveTheme,
  type AppTheme,
} from '@/features/settings/theme';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SettingsModal({ open, onClose }: Props) {
  const [theme, setTheme] = useState<AppTheme>(loadTheme);

  function handleThemeChange(next: AppTheme) {
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  }

  return (
    <Modal
      open={open}
      title="Настройки"
      onClose={onClose}
      footer={
        <Button variant="primary" onClick={onClose}>
          Готово
        </Button>
      }
    >
      <div className="settings-modal">
        <section className="settings-modal__section">
          <h3 className="settings-modal__label">Тема оформления</h3>
          <p className="settings-modal__hint">
            Цветовая палитра интерфейса. Сохраняется на этом устройстве.
          </p>
          <ThemePicker theme={theme} onChange={handleThemeChange} />
        </section>
      </div>
    </Modal>
  );
}
