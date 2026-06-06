import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type {
  AdminActivityDailyParticipant,
  AdminActivityResponse,
  AdminActivityUser,
  AdminStatisticsResponse,
  AdminStatisticsUser,
} from '@/shared/api/types';
import { ScheduleMonthNav } from '@/features/calendar/ScheduleMonthNav';
import {
  ACTIVITY_SORT_OPTIONS,
  sortActivityUsers,
  type ActivitySortDirection,
  type ActivitySortKey,
} from '@/features/statistics/sortActivityUsers';
import {
  buildSortOptions,
  sortStatisticsUsers,
  type StatisticsSortDirection,
  type StatisticsSortKey,
} from '@/features/statistics/sortStatisticsUsers';
import { SubpageLayout } from '@/shared/ui/SubpageLayout';

type StatisticsTab = 'duties' | 'activity';

const SORT_GROUP_ORDER = [
  'Общее',
  'Дежурства',
  'Отсутствия',
  'По типу за месяц',
  'По типу за год',
] as const;

const TOOLTIP_VIEWPORT_MARGIN = 8;
const TOOLTIP_GAP = 8;

function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDayLabel(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

function roomLabel(room: AdminActivityResponse['summary']['topRooms'][0]): string {
  if (room.title?.trim()) return room.title;
  return room.type === 'direct' ? 'Личный чат' : 'Группа';
}

function formatParticipantLabel(participant: AdminActivityDailyParticipant): string {
  return participant.count > 1
    ? `${participant.name} (${participant.count})`
    : participant.name;
}

function DailyValueWithTooltip({
  value,
  participants,
  label,
}: {
  value: number;
  participants: AdminActivityDailyParticipant[];
  label: string;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({
    position: 'fixed',
    left: 0,
    top: 0,
    visibility: 'hidden',
  });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    const tooltip = tooltipRef.current;
    if (!anchor || !tooltip) return;

    const anchorRect = anchor.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = anchorRect.top - tooltipRect.height - TOOLTIP_GAP;
    let left =
      anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;

    left = Math.max(
      TOOLTIP_VIEWPORT_MARGIN,
      Math.min(left, viewportWidth - tooltipRect.width - TOOLTIP_VIEWPORT_MARGIN),
    );

    if (top < TOOLTIP_VIEWPORT_MARGIN) {
      top = anchorRect.bottom + TOOLTIP_GAP;
    }

    top = Math.max(
      TOOLTIP_VIEWPORT_MARGIN,
      Math.min(top, viewportHeight - tooltipRect.height - TOOLTIP_VIEWPORT_MARGIN),
    );

    setTooltipStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      visibility: 'visible',
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, participants, label, value]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, updatePosition]);

  if (value === 0 || participants.length === 0) {
    return <span>{value}</span>;
  }

  return (
    <span
      ref={anchorRef}
      className="admin-statistics-page__daily-value"
      tabIndex={0}
      aria-label={`${label}: ${participants.map(formatParticipantLabel).join(', ')}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {value}
      {open
        ? createPortal(
            <span
              ref={tooltipRef}
              className="admin-statistics-page__daily-tooltip"
              style={tooltipStyle}
              role="tooltip"
            >
              <span className="admin-statistics-page__daily-tooltip-title">{label}</span>
              <ul className="admin-statistics-page__daily-tooltip-list">
                {participants.map((participant, index) => (
                  <li key={`${participant.name}-${index}`}>
                    {formatParticipantLabel(participant)}
                  </li>
                ))}
              </ul>
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}

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

function ActivityUserCard({ user }: { user: AdminActivityUser }) {
  return (
    <li className="admin-statistics-page__card">
      <p className="admin-statistics-page__name">{user.fullName}</p>
      <dl className="admin-statistics-page__stats">
        <div className="admin-statistics-page__stat">
          <dt>Последняя активность</dt>
          <dd className="admin-statistics-page__stat-value--sm">
            {formatShortDate(user.lastActiveAt)}
          </dd>
        </div>
        <div className="admin-statistics-page__stat">
          <dt>Входы за месяц</dt>
          <dd>{user.loginsMonth}</dd>
        </div>
        <div className="admin-statistics-page__stat admin-statistics-page__stat--activity">
          <dt>Сообщения</dt>
          <dd>{user.chatMessagesMonth}</dd>
        </div>
        <div className="admin-statistics-page__stat admin-statistics-page__stat--activity">
          <dt>Вложения</dt>
          <dd>{user.chatAttachmentsMonth}</dd>
        </div>
      </dl>
    </li>
  );
}

function SortToolbar({
  sortKey,
  sortDirection,
  onSortKeyChange,
  onDirectionToggle,
  children,
}: {
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  onSortKeyChange: (key: string) => void;
  onDirectionToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="admin-statistics-page__toolbar">
      <label className="admin-statistics-page__sort-label">
        <span className="admin-statistics-page__sort-caption">Сортировка</span>
        <select
          className="admin-statistics-page__select"
          value={sortKey}
          onChange={(e) => onSortKeyChange(e.target.value)}
        >
          {children}
        </select>
      </label>
      <button
        type="button"
        className="admin-statistics-page__direction"
        onClick={onDirectionToggle}
        aria-label={
          sortDirection === 'desc'
            ? 'Сортировать по убыванию'
            : 'Сортировать по возрастанию'
        }
      >
        {sortDirection === 'desc' ? '↓ Убыв.' : '↑ Возр.'}
      </button>
    </div>
  );
}

function DutiesTabContent({
  year,
  monthNum,
}: {
  year: number;
  monthNum: number;
}) {
  const [sortKey, setSortKey] = useState<StatisticsSortKey>('duties_month');
  const [sortDirection, setSortDirection] =
    useState<StatisticsSortDirection>('desc');

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
    <>
      <p className="admin-statistics-page__hint">
        Дежурства — назначенные слоты. Отсутствия — записи из импорта графика с указанной
        причиной.
      </p>

      {!isLoading && !error && users.length > 0 ? (
        <SortToolbar
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortKeyChange={(v) => setSortKey(v as StatisticsSortKey)}
          onDirectionToggle={() =>
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
          }
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
        </SortToolbar>
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
    </>
  );
}

function ActivityTabContent({
  year,
  monthNum,
}: {
  year: number;
  monthNum: number;
}) {
  const [sortKey, setSortKey] = useState<ActivitySortKey>('chat_messages');
  const [sortDirection, setSortDirection] =
    useState<ActivitySortDirection>('desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'statistics', 'activity', year, monthNum],
    queryFn: () =>
      apiRequest<AdminActivityResponse>(
        `/admin/statistics/activity?year=${year}&month=${monthNum}`,
      ),
  });

  const users = data?.users ?? [];
  const sortedUsers = useMemo(
    () => sortActivityUsers(users, sortKey, sortDirection),
    [users, sortKey, sortDirection],
  );

  const maxDailyMessages = useMemo(() => {
    if (!data?.daily.length) return 1;
    return Math.max(1, ...data.daily.map((d) => d.chatMessages));
  }, [data?.daily]);

  const summary = data?.summary;

  return (
    <>
      <p className="admin-statistics-page__hint">
        {data?.trackingNote ??
          'Активные пользователи — те, кто заходил, входил в систему или писал в чат.'}
      </p>

      {isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {error ? (
        <p className="form-message form-message--error">{(error as Error).message}</p>
      ) : null}

      {summary ? (
        <>
          <div className="admin-statistics-page__summary">
            <div className="admin-statistics-page__stat">
              <dt>Активных за месяц</dt>
              <dd>{summary.activeUsersMonth}</dd>
            </div>
            <div className="admin-statistics-page__stat">
              <dt>WAU (7 дней)</dt>
              <dd>{summary.wau}</dd>
            </div>
            <div className="admin-statistics-page__stat">
              <dt>Сегодня активных</dt>
              <dd>{summary.dauToday}</dd>
            </div>
            <div className="admin-statistics-page__stat">
              <dt>Средн. активных/день</dt>
              <dd>{summary.dauMonthAvg}</dd>
            </div>
            <div className="admin-statistics-page__stat admin-statistics-page__stat--activity">
              <dt>Входов</dt>
              <dd>{summary.logins}</dd>
            </div>
            <div className="admin-statistics-page__stat admin-statistics-page__stat--activity">
              <dt>Регистраций</dt>
              <dd>{summary.registrations}</dd>
            </div>
            <div className="admin-statistics-page__stat admin-statistics-page__stat--activity">
              <dt>Сообщений</dt>
              <dd>{summary.chatMessages}</dd>
            </div>
            <div className="admin-statistics-page__stat admin-statistics-page__stat--activity">
              <dt>Вложений</dt>
              <dd>{summary.chatAttachments}</dd>
            </div>
          </div>

          <p className="admin-statistics-page__meta">
            Чатов: {summary.roomsTotal} (личных {summary.roomsDirect}, групп{' '}
            {summary.roomsGroup}) · реакций {summary.chatReactions}
          </p>

          {summary.topRooms.length > 0 ? (
            <div className="admin-statistics-page__top-rooms">
              <p className="admin-statistics-page__breakdown-title">
                Топ комнат за месяц
              </p>
              <ul className="admin-statistics-page__breakdown-list">
                {summary.topRooms.map((room) => (
                  <li key={room.roomId} className="admin-statistics-page__breakdown-item">
                    <span className="admin-statistics-page__breakdown-type">
                      {roomLabel(room)}
                    </span>
                    <span className="admin-statistics-page__breakdown-count">
                      {room.messages}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.daily.length > 0 ? (
            <div className="admin-statistics-page__daily">
              <p className="admin-statistics-page__breakdown-title">По дням</p>
              <p className="admin-statistics-page__meta">
                Наведите на число — покажется список пользователей.
              </p>
              <div className="admin-statistics-page__daily-table-wrap">
                <table className="admin-statistics-page__daily-table">
                  <thead>
                    <tr>
                      <th>День</th>
                      <th>Актив.</th>
                      <th>Входы</th>
                      <th>Чат</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((row) => (
                      <tr key={row.date}>
                        <td>{formatDayLabel(row.date)}</td>
                        <td>
                          <DailyValueWithTooltip
                            value={row.activeUsers}
                            participants={row.activeParticipants}
                            label="Активные"
                          />
                        </td>
                        <td>
                          <DailyValueWithTooltip
                            value={row.logins}
                            participants={row.loginParticipants}
                            label="Входы"
                          />
                        </td>
                        <td>
                          <span className="admin-statistics-page__daily-chat">
                            <span
                              className="admin-statistics-page__daily-bar"
                              style={{
                                width: `${(row.chatMessages / maxDailyMessages) * 100}%`,
                              }}
                            />
                            <DailyValueWithTooltip
                              value={row.chatMessages}
                              participants={row.chatParticipants}
                              label="Сообщения"
                            />
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {!isLoading && !error && users.length > 0 ? (
        <SortToolbar
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortKeyChange={(v) => setSortKey(v as ActivitySortKey)}
          onDirectionToggle={() =>
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
          }
        >
          {ACTIVITY_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SortToolbar>
      ) : null}

      {!isLoading && !error && users.length === 0 ? (
        <p className="admin-statistics-page__empty">Нет одобренных пользователей</p>
      ) : null}

      {!isLoading && !error && sortedUsers.length > 0 ? (
        <ul className="admin-statistics-page__list">
          {sortedUsers.map((user) => (
            <ActivityUserCard key={user.id} user={user} />
          ))}
        </ul>
      ) : null}
    </>
  );
}

export function AdminStatisticsPage() {
  const [tab, setTab] = useState<StatisticsTab>('duties');
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  return (
    <SubpageLayout className="admin-statistics-page" title="Статистика">
      <div
        className="admin-statistics-page__tabs"
        role="tablist"
        aria-label="Раздел статистики"
      >
        <button
          type="button"
          role="tab"
          className={`admin-statistics-page__tab${tab === 'duties' ? ' admin-statistics-page__tab--active' : ''}`}
          aria-selected={tab === 'duties'}
          onClick={() => setTab('duties')}
        >
          Дежурства
        </button>
        <button
          type="button"
          role="tab"
          className={`admin-statistics-page__tab${tab === 'activity' ? ' admin-statistics-page__tab--active' : ''}`}
          aria-selected={tab === 'activity'}
          onClick={() => setTab('activity')}
        >
          Активность
        </button>
      </div>

      <ScheduleMonthNav
        month={month}
        onMonthChange={(m) => setMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
      />

      {tab === 'duties' ? (
        <DutiesTabContent year={year} monthNum={monthNum} />
      ) : (
        <ActivityTabContent year={year} monthNum={monthNum} />
      )}
    </SubpageLayout>
  );
}
