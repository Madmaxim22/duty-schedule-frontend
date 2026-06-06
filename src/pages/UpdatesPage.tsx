import { useQuery } from '@tanstack/react-query';
import { fetchAppVersion, fetchReleases } from '@/shared/api/onboarding';
import { ReleaseNotesList } from '@/features/onboarding/ReleaseNotesList';
import { SubpageLayout } from '@/shared/ui/SubpageLayout';

export function UpdatesPage() {
  const versionQuery = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchAppVersion,
  });

  const releasesQuery = useQuery({
    queryKey: ['releases'],
    queryFn: fetchReleases,
  });

  const version = versionQuery.data?.version;
  const releases = releasesQuery.data?.releases ?? [];

  return (
    <SubpageLayout className="updates-page" title="Обновления">
      {version ? (
        <p className="updates-page__version">Текущая версия: {version}</p>
      ) : null}

      {releasesQuery.isLoading ? (
        <p className="page-loading">Загрузка…</p>
      ) : null}

      {releasesQuery.error ? (
        <p className="form-message form-message--error">
          {(releasesQuery.error as Error).message}
        </p>
      ) : null}

      <div className="updates-page__list">
        {releases.map((release) => (
          <ReleaseNotesList
            key={release.id}
            release={release}
            isCurrent={release.isCurrent}
          />
        ))}
      </div>
    </SubpageLayout>
  );
}
