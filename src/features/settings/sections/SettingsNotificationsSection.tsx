import { PushBanner } from '@/features/push/PushBanner';
import { useIsNativeApp } from '@/shared/capacitor/useIsNativeApp';
import { SettingsSection } from './SettingsSection';

type Props = {
  isAdmin: boolean;
};

export function SettingsNotificationsSection({ isAdmin }: Props) {
  const isNative = useIsNativeApp();

  const description = isAdmin
    ? 'Получать push о новых заявках, изменениях графика, сообщениях в чате и других событиях.'
    : 'Получать push об изменении вашего графика, лайках фото, сообщениях в чате и других событиях.';

  return (
    <SettingsSection titleId="settings-notifications-title" title="Уведомления">
      <p className="settings-page__section-hint">
        {isNative
          ? 'Push в шторке Android (FCM), когда приложение закрыто. Лента событий — в разделе «Оповещения».'
          : 'Push через браузер (Web Push), когда вкладка или PWA закрыты. Лента событий — в разделе «Оповещения».'}
      </p>
      <PushBanner description={description} />
    </SettingsSection>
  );
}
