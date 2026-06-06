import { useAuth } from '@/features/auth/AuthContext';
import { useIsNativeApp } from '@/shared/capacitor/useIsNativeApp';
import { SettingsAppearanceSection } from '@/features/settings/sections/SettingsAppearanceSection';
import { SettingsBrowserSection } from '@/features/settings/sections/SettingsBrowserSection';
import { SettingsNativeSection } from '@/features/settings/sections/SettingsNativeSection';
import { SettingsNotificationsSection } from '@/features/settings/sections/SettingsNotificationsSection';
import { SubpageLayout } from '@/shared/ui/SubpageLayout';

export function SettingsPage() {
  const { user } = useAuth();
  const isNative = useIsNativeApp();
  const isAdmin = user?.role === 'admin';

  return (
    <SubpageLayout className="settings-page" title="Настройки">
      <SettingsAppearanceSection />
      {isNative ? <SettingsNativeSection /> : <SettingsBrowserSection />}
      <SettingsNotificationsSection isAdmin={isAdmin} />
    </SubpageLayout>
  );
}
