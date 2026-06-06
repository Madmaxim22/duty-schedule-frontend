import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAppVersion } from '@/shared/api/onboarding';
import { SettingsSection } from './SettingsSection';

export function SettingsAboutSection() {
  const versionQuery = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchAppVersion,
    staleTime: 300_000,
  });

  return (
    <SettingsSection titleId="settings-about-title" title="О приложении">
      <p className="settings-page__section-hint">
        {versionQuery.data?.version
          ? `Версия ${versionQuery.data.version}`
          : 'Версия загружается…'}
      </p>
      <p className="settings-page__section-hint">
        <Link to="/updates">История обновлений</Link>
      </p>
    </SettingsSection>
  );
}
