import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { apiRequest } from '@/shared/api/client';
import type { AdminStatisticsResponse, AdminStatisticsUser } from '@/shared/api/types';
import { ScheduleMonthNav } from '@/features/calendar/ScheduleMonthNav';
import {
  buildSortOptions,
  sortStatisticsUsers,
  type StatisticsSortDirection,
  type StatisticsSortKey,
} from '@/features/statistics/sortStatisticsUsers';

const SORT_GROUP_ORDER = [
  'Общее',
  'Дежурства',
  'Отсутствия',
  'По типу за месяц',
  'По типу за год',
] as const;

function AbsenceBreakdown({
  label,
  items,
}: {
  label: string;
  items: AdminStatisticsResponse['users'][0]['absences']['monthByType'];
}) {
  if (items.length === 0) {
    return (
      <p className="admin-statistics-page__breakdown-empty">
        {label}: нет записей
      </p>
    );
  }

  return (
    <div className="admin-statistics-page__breakdown">
      <p className="admin-statistics-page__breakdown-title">{label}</p>
      <ul className="admin-statistics-page__breakdown-list">
        {items.map((item) => (
          <li key={item.type} className="admin-statistics-page__breakdown-item">
            <span className="admin-statistics-page__breakdown-type">
              {item.type}
            </span>
            <span className="admin-statistics-page__breakdown-count">
              {item.count}
            </span>
            {item.dates.length > 0 ? (
              <span className="admin-statistics-page__breakdown-dates">
                {item.dates
                  .map((d) =>
                    new Date(`${d}T12:00:00`).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    }),
                  )
                  .join(', ')}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function UserStatsCard({
  user,
  monthNum,
  year,
}: {
  user: AdminStatisticsUser;
  monthNum: number;
  year: number;
}) {
  const hasAbsenceDetails =
    user.absences.monthByType.length > 0 || user.absences.yearByType.length > 0;

  return (
    <li className="admin-statistics-page__card">
      <p className="admin-statistics-page__name">{user.fullName}</p>

      <dl className="admin-statistics-page__stats">
        <div className="admin-statistics-page__stat">
          <dt>Дежурства за месяц</dt>
          <dd>{user.duties.month}</dd>
        </div>
        <div className="admin-statistics-page__stat">
          <dt>Дежурства за год</dt>
          <dd>{user.duties.year}</dd>
        </div>
        <div className="admin-statistics-page__stat admin-statistics-page__stat--absence">
          <dt>Отсутствия за месяц</dt>
          <dd>{user.absences.month}</dd>
        </div>
        <div className="admin-statistics-page__stat admin-statistics-page__stat--absence">
          <dt>Отсутствия за год</dt>
          <dd>{user.absences.year}</dd>
        </div>
      </dl>

      {hasAbsenceDetails ? (
        <details className="admin-statistics-page__details">
          <summary className="admin-statistics-page__details-summary">
            Причины отсутствий
          </summary>
          <div className="admin-statistics-page__details-body">
            <AbsenceBreakdown
              label={`За ${monthNum}.${year}`}
              items={user.absences.monthByType}
            />
            <AbsenceBreakdown
              label={`За ${year} год`}
              items={user.absences.yearByType}
            />
          </div>
        </details>
      ) : null}
    </li>
  );
}

export function AdminStatisticsPage() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [sortKey, setSortKey] = useState<StatisticsSortKey>('duties_month');
  const [sortDirection, setSortDirection] =
    useState<StatisticsSortDirection>('desc');

  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'statistics', year, monthNum],
    queryFn: () =>
      apiRequest<AdminStatisticsResponse>(
        `/admin/statistics?year=${year}&month=${monthNum}`,
      ),
  });

  const users = data?.users ?? [];
  const sortOptions = useMemo(() => buildSortOptions(users), [users]);

  useEffect(() => {
    if (sortOptions.length > 0 && !sortOptions.some((o) => o.value === sortKey)) {
      setSortKey('name');
    }
  }, [sortOptions, sortKey]);

  const sortedUsers = useMemo(
    () => sortStatisticsUsers(users, sortKey, sortDirection),
    [users, sortKey, sortDirection],
  );

  const sortGroups = useMemo(() => {
    const groups = new Set(sortOptions.map((o) => o.group));
    return SORT_GROUP_ORDER.filter((g) => groups.has(g));
  }, [sortOptions]);

  return (
    <div className="admin-statistics-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Статистика</h1>
      </header>

      <ScheduleMonthNav
        month={month}
        onMonthChange={(m) => setMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
      />

      <p className="admin-statistics-page__hint">
        Дежурства — назначенные слоты. Отсутствия — записи из импорта графика с указанной
        причиной.
      </p>

      {!isLoading && !error && users.length > 0 ? (
        <div className="admin-statistics-page__toolbar">
          <label className="admin-statistics-page__sort-label">
            <span className="admin-statistics-page__sort-caption">Сортировка</span>
            <select
              className="admin-statistics-page__select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as StatisticsSortKey)}
            >
              {sortGroups.map((group) => (
                <optgroup key={group} label={group}>
                  {sortOptions
                    .filter((o) => o.group === group)
                    .map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="admin-statistics-page__direction"
            onClick={() =>
              setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
            }
            aria-label={
              sortDirection === 'desc'
                ? 'Сортировать по убыванию'
                : 'Сортировать по возрастанию'
            }
          >
            {sortDirection === 'desc' ? '↓ Убыв.' : '↑ Возр.'}
          </button>
        </div>
      ) : null}

      {isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {error ? (
        <p className="form-message form-message--error">{(error as Error).message}</p>
      ) : null}

      {!isLoading && !error && users.length === 0 ? (
        <p className="admin-statistics-page__empty">Нет одобренных пользователей</p>
      ) : null}

      {!isLoading && !error && sortedUsers.length > 0 ? (
        <ul className="admin-statistics-page__list">
          {sortedUsers.map((user) => (
            <UserStatsCard
              key={user.id}
              user={user}
              monthNum={monthNum}
              year={year}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
