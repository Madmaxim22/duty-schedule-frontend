type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
};

function shiftMonth(month: Date, delta: number) {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

export function ScheduleMonthNav({ month, onMonthChange }: Props) {
  const label = month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="schedule-month-nav">
      <button
        type="button"
        className="schedule-month-nav__btn"
        aria-label="Предыдущий месяц"
        onClick={() => onMonthChange(shiftMonth(month, -1))}
      >
        ‹
      </button>
      <span className="schedule-month-nav__label">{label}</span>
      <button
        type="button"
        className="schedule-month-nav__btn"
        aria-label="Следующий месяц"
        onClick={() => onMonthChange(shiftMonth(month, 1))}
      >
        ›
      </button>
    </div>
  );
}
