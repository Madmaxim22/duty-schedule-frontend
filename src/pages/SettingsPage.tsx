import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { useAuth } from '@/features/auth/AuthContext';
import { useIsNativeApp } from '@/shared/capacitor/useIsNativeApp';
import { SettingsAboutSection } from '@/features/settings/sections/SettingsAboutSection';
import { SettingsAppearanceSection } from '@/features/settings/sections/SettingsAppearanceSection';
import { SettingsBrowserSection } from '@/features/settings/sections/SettingsBrowserSection';
import { SettingsNativeSection } from '@/features/settings/sections/SettingsNativeSection';
import { SettingsNotificationsSection } from '@/features/settings/sections/SettingsNotificationsSection';

export function SettingsPage() {
  const { user } = useAuth();
  const isNative = useIsNativeApp();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="settings-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Настройки</h1>
      </header>

      <SettingsAboutSection />
      <SettingsAppearanceSection />
      {isNative ? <SettingsNativeSection /> : <SettingsBrowserSection />}
      <SettingsNotificationsSection isAdmin={isAdmin} />
    </div>
  );
}
