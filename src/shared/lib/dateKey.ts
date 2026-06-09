import { addDays } from 'date-fns';

export function parseDateKey(date: string): Date {
  return new Date(`${date}T12:00:00`);
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function shiftDateKey(dateKey: string, deltaDays: number): string {
  return toDateKey(addDays(parseDateKey(dateKey), deltaDays));
}
