import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { fetchAppVersion, fetchReleases } from '@/shared/api/onboarding';
import { ReleaseNotesList } from '@/features/onboarding/ReleaseNotesList';

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
    <div className="updates-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Обновления</h1>
      </header>

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
    </div>
  );
}
