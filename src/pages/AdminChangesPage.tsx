import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { apiRequest } from '@/shared/api/client';
import type { DutyChangesResponse } from '@/shared/api/types';
import {
  formatChangeSource,
  formatDutyChangeDescription,
} from '@/shared/lib/formatDutyChange';
import { Button } from '@/shared/ui/Button';

export function AdminChangesPage() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['schedule', 'changes'],
      queryFn: ({ pageParam }) => {
        const params = new URLSearchParams({ limit: '50' });
        if (pageParam) params.set('cursor', pageParam);
        return apiRequest<DutyChangesResponse>(`/schedule/changes?${params}`);
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const changes = data?.pages.flatMap((p) => p.changes) ?? [];

  return (
    <div className="admin-changes-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Изменения дежурств</h1>
      </header>

      {isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {error ? (
        <p className="form-message form-message--error">{(error as Error).message}</p>
      ) : null}

      {!isLoading && !error && changes.length === 0 ? (
        <p className="admin-changes-page__empty">Пока нет записей</p>
      ) : null}

      {!isLoading && !error && changes.length > 0 ? (
        <ul className="admin-changes-page__list">
          {changes.map((change) => (
            <li key={change.id} className="admin-changes-page__item">
              <p className="admin-changes-page__desc">
                {formatDutyChangeDescription(change)}
              </p>
              <p className="admin-changes-page__meta">
                <span
                  className={`admin-changes-page__badge admin-changes-page__badge--${change.source}`}
                >
                  {formatChangeSource(change.source)}
                </span>
                <time dateTime={change.createdAt}>
                  {new Date(change.createdAt).toLocaleString('ru-RU')}
                </time>
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {hasNextPage ? (
        <Button
          variant="secondary"
          className="admin-changes-page__more"
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? 'Загрузка…' : 'Загрузить ещё'}
        </Button>
      ) : null}
    </div>
  );
}
