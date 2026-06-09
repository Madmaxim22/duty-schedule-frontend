/** Фиксированные нерабочие праздники РФ (месяц-день). */
const FIXED_HOLIDAYS = new Set([
  '01-01',
  '01-02',
  '01-03',
  '01-04',
  '01-05',
  '01-06',
  '01-07',
  '01-08',
  '02-23',
  '03-08',
  '05-01',
  '05-09',
  '06-12',
  '11-04',
]);

export function isWeekend(dateStr: string): boolean {
  const day = new Date(`${dateStr}T12:00:00`).getDay();
  return day === 0 || day === 6;
}

export function isPublicHoliday(dateStr: string): boolean {
  return FIXED_HOLIDAYS.has(dateStr.slice(5));
}
