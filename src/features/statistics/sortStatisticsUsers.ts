import type { AdminStatisticsUser } from '@/shared/api/types';

export type StatisticsSortDirection = 'asc' | 'desc';

export type StatisticsSortKey =
  | 'name'
  | 'duties_month'
  | 'duties_year'
  | 'absences_month'
  | 'absences_year'
  | `absence_type_month:${string}`
  | `absence_type_year:${string}`;

export function collectAbsenceTypes(
  users: AdminStatisticsUser[],
  period: 'month' | 'year',
): string[] {
  const types = new Set<string>();
  for (const user of users) {
    const list =
      period === 'month' ? user.absences.monthByType : user.absences.yearByType;
    for (const item of list) types.add(item.type);
  }
  return [...types].sort((a, b) => a.localeCompare(b, 'ru'));
}

function absenceCountByType(
  user: AdminStatisticsUser,
  type: string,
  period: 'month' | 'year',
): number {
  const list =
    period === 'month' ? user.absences.monthByType : user.absences.yearByType;
  return list.find((item) => item.type === type)?.count ?? 0;
}

function sortValue(user: AdminStatisticsUser, key: StatisticsSortKey): number | string {
  switch (key) {
    case 'name':
      return user.fullName;
    case 'duties_month':
      return user.duties.month;
    case 'duties_year':
      return user.duties.year;
    case 'absences_month':
      return user.absences.month;
    case 'absences_year':
      return user.absences.year;
    default:
      if (key.startsWith('absence_type_month:')) {
        return absenceCountByType(user, key.slice('absence_type_month:'.length), 'month');
      }
      if (key.startsWith('absence_type_year:')) {
        return absenceCountByType(user, key.slice('absence_type_year:'.length), 'year');
      }
      return 0;
  }
}

export function sortStatisticsUsers(
  users: AdminStatisticsUser[],
  key: StatisticsSortKey,
  direction: StatisticsSortDirection,
): AdminStatisticsUser[] {
  const sorted = [...users];
  const sign = direction === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);

    if (typeof va === 'string' && typeof vb === 'string') {
      return sign * va.localeCompare(vb, 'ru');
    }

    const na = Number(va);
    const nb = Number(vb);
    if (na !== nb) return sign * (na - nb);
    return a.fullName.localeCompare(b.fullName, 'ru');
  });

  return sorted;
}

export function buildSortOptions(users: AdminStatisticsUser[]): Array<{
  value: StatisticsSortKey;
  label: string;
  group: string;
}> {
  const options: Array<{ value: StatisticsSortKey; label: string; group: string }> = [
    { value: 'name', label: 'По имени', group: 'Общее' },
    { value: 'duties_month', label: 'Дежурства за месяц', group: 'Дежурства' },
    { value: 'duties_year', label: 'Дежурства за год', group: 'Дежурства' },
    {
      value: 'absences_month',
      label: 'Отсутствия всего за месяц',
      group: 'Отсутствия',
    },
    {
      value: 'absences_year',
      label: 'Отсутствия всего за год',
      group: 'Отсутствия',
    },
  ];

  for (const type of collectAbsenceTypes(users, 'month')) {
    options.push({
      value: `absence_type_month:${type}`,
      label: `${type} (месяц)`,
      group: 'По типу за месяц',
    });
  }

  for (const type of collectAbsenceTypes(users, 'year')) {
    options.push({
      value: `absence_type_year:${type}`,
      label: `${type} (год)`,
      group: 'По типу за год',
    });
  }

  return options;
}
