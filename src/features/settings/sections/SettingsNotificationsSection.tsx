import { PushBanner } from '@/features/push/PushBanner';
import { SettingsSection } from './SettingsSection';

type Props = {
  isAdmin: boolean;
};

export function SettingsNotificationsSection({ isAdmin }: Props) {
  const description = isAdmin
    ? 'Получать push о новых заявках, изменениях графика, сообщениях в чате и других событиях.'
    : 'Получать push об изменении вашего графика, лайках фото, сообщениях в чате и других событиях.';

  return (
    <SettingsSection titleId="settings-notifications-title" title="Уведомления">
      <PushBanner description={description} />
    </SettingsSection>
  );
}
