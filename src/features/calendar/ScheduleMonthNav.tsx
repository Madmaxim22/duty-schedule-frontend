import { formatScheduleMonthCaption } from '@/shared/lib/formatMonthCaption';
import { MonthNavChevron } from './MonthNavChevron';

type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
};

function shiftMonth(month: Date, delta: number) {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

export function ScheduleMonthNav({ month, onMonthChange }: Props) {
  const label = formatScheduleMonthCaption(month);

  return (
    <div className="schedule-month-nav">
      <button
        type="button"
        className="schedule-month-nav__btn"
        aria-label="Предыдущий месяц"
        onClick={() => onMonthChange(shiftMonth(month, -1))}
      >
        <MonthNavChevron orientation="left" className="schedule-month-nav__chevron" />
      </button>
      <span className="schedule-month-nav__label">{label}</span>
      <button
        type="button"
        className="schedule-month-nav__btn"
        aria-label="Следующий месяц"
        onClick={() => onMonthChange(shiftMonth(month, 1))}
      >
        <MonthNavChevron orientation="right" className="schedule-month-nav__chevron" />
      </button>
    </div>
  );
}
