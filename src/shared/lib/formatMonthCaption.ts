import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/** Подпись месяца как в календаре (react-day-picker): «май 2026». */
export function formatScheduleMonthCaption(month: Date): string {
  return format(month, 'LLLL y', { locale: ru });
}
