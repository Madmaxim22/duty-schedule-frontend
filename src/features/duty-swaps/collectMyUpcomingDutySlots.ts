import type { MonthSchedule } from '@/shared/api/types';
import type { SwapSlotPick } from '@/features/duty-swaps/SwapRequestModal';

/** Окно выбора своего дежурства относительно даты дежурства коллеги (дни). */
export const SWAP_SLOT_WINDOW_DAYS = 5;

export type MonthKey = { year: number; month: number };

export type SwapSlotWindow = {
  anchor: string;
  rangeStart: string;
  rangeEnd: string;
  monthKeys: MonthKey[];
};

/** Локальная календарная дата (как в календаре приложения). */
export function todayLocalDateStr(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD из ISO-строки API. */
export function normalizeIsoDate(dateStr: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(dateStr.trim());
  if (!match) {
    throw new Error(`Некорректная дата: ${dateStr}`);
  }
  return match[1];
}

function parseUtcDate(dateStr: string): Date {
  const iso = normalizeIsoDate(dateStr);
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addUtcDays(dateStr: string, deltaDays: number): string {
  const dt = parseUtcDate(dateStr);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

/** Все календарные месяцы, пересекающиеся с [startDate, endDate] (включая переход май→июнь). */
export function monthKeysForDateRange(startDate: string, endDate: string): MonthKey[] {
  const start = parseUtcDate(startDate);
  const end = parseUtcDate(endDate);
  if (start > end) return [];

  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1;
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth() + 1;
  const keys: MonthKey[] = [];

  while (year < endYear || (year === endYear && month <= endMonth)) {
    keys.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return keys;
}

/** Окно ±windowDays вокруг дежурства коллеги и месяцы для загрузки расписания. */
export function getSwapSlotWindow(
  anchorDate: string,
  windowDays = SWAP_SLOT_WINDOW_DAYS,
): SwapSlotWindow {
  const anchor = normalizeIsoDate(anchorDate);
  const rangeStart = addUtcDays(anchor, -windowDays);
  const rangeEnd = addUtcDays(anchor, windowDays);
  const monthKeys = monthKeysForDateRange(rangeStart, rangeEnd);
  return { anchor, rangeStart, rangeEnd, monthKeys };
}

export function monthKeysAroundToday(count = 3): Array<{ year: number; month: number }> {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  const keys: Array<{ year: number; month: number }> = [];

  for (let i = 0; i < count; i++) {
    keys.push({ year, month });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return keys;
}

export function collectMyUpcomingDutySlots(
  schedules: MonthSchedule[],
  userId: string,
  options?: { anchorDate?: string; windowDays?: number },
): SwapSlotPick[] {
  const windowDays = options?.windowDays ?? SWAP_SLOT_WINDOW_DAYS;
  let rangeMin: string | null = null;
  let rangeMax: string | null = null;

  if (options?.anchorDate) {
    const anchor = normalizeIsoDate(options.anchorDate);
    rangeMin = addUtcDays(anchor, -windowDays);
    rangeMax = addUtcDays(anchor, windowDays);
  } else {
    rangeMin = todayLocalDateStr();
  }

  const today = todayLocalDateStr();
  const slots: SwapSlotPick[] = [];

  for (const schedule of schedules) {
    for (const day of schedule.days) {
      if (day.isAbsent) continue;
      if (day.date < today) continue;
      if (rangeMin !== null && day.date < rangeMin) continue;
      if (rangeMax !== null && day.date > rangeMax) continue;
      for (const duty of day.duties) {
        if (duty.userId !== userId) continue;
        slots.push({
          date: day.date,
          section: duty.section,
          office: duty.office,
        });
      }
    }
  }

  slots.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      a.section.localeCompare(b.section) ||
      a.office.localeCompare(b.office),
  );

  return slots;
}

export function slotKey(slot: SwapSlotPick): string {
  return `${slot.date}-${slot.section}-${slot.office}`;
}
