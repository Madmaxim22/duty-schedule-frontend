import type { MonthDay } from '@/shared/api/types';

export type MonthRow = {
  date: string;
  dayNum: number;
  weekday: string;
  isMyDuty: boolean;
  duties: MonthDay['duties'];
  isIncomplete: boolean;
};

export function buildMonthRows(
  month: Date,
  days: MonthDay[],
  incompleteDates?: string[],
): MonthRow[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const incompleteSet = new Set(incompleteDates ?? []);
  const y = month.getFullYear();
  const m = month.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_, i) => {
    const dayNum = i + 1;
    const date = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const meta = byDate.get(date);
    const d = new Date(`${date}T12:00:00`);
    return {
      date,
      dayNum,
      weekday: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      isMyDuty: meta?.isMyDuty ?? false,
      duties: meta?.duties ?? [],
      isIncomplete: incompleteSet.has(date),
    };
  });
}
