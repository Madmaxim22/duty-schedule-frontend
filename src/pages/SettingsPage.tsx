import { useState } from 'react';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { useAuth } from '@/features/auth/AuthContext';
import { ThemePicker } from '@/features/settings/ThemePicker';
import { applyTheme, loadTheme, saveTheme, type AppTheme } from '@/features/settings/theme';
import { PushBanner } from '@/features/push/AdminPushBanner';

export function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [theme, setTheme] = useState<AppTheme>(() => loadTheme());

  function handleThemeChange(next: AppTheme) {
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <Link to="/" className="settings-page__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="settings-page__title">Настройки</h1>
      </header>

      <section className="settings-page__section" aria-labelledby="settings-appearance-title">
        <h2 id="settings-appearance-title" className="settings-page__section-title">
          Оформление
        </h2>
        <p className="settings-page__section-hint">
          Цветовая палитра интерфейса. Сохраняется на этом устройстве.
        </p>
        <ThemePicker theme={theme} onChange={handleThemeChange} />
      </section>

      <section className="settings-page__section" aria-labelledby="settings-notifications-title">
        <h2 id="settings-notifications-title" className="settings-page__section-title">
          Уведомления
        </h2>
        <p className="settings-page__section-hint">
          Push-сообщения в браузере, когда приложение закрыто. Лента событий — в разделе «Оповещения».
        </p>
        <PushBanner
          description={
            isAdmin
              ? 'Получать push о новых заявках, изменениях графика и других событиях.'
              : 'Получать push об изменении вашего графика, лайках фото и других событиях.'
          }
        />
      </section>
    </div>
  );
}
