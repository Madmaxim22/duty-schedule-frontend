import { useMemo } from 'react';
import type { MonthDay } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { buildMonthRows } from './buildMonthRows';
import { ScheduleMonthNav } from './ScheduleMonthNav';

type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
  days: MonthDay[];
  incompleteDates?: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export function DutyDayList({
  month,
  onMonthChange,
  days,
  incompleteDates,
  selectedDate,
  onSelectDate,
}: Props) {
  const rows = useMemo(
    () => buildMonthRows(month, days, incompleteDates),
    [month, days, incompleteDates],
  );

  return (
    <section className="duty-day-list" aria-label="Расписание по дням">
      <ScheduleMonthNav month={month} onMonthChange={onMonthChange} />
      <ul className="duty-day-list__scroll">
        {rows.map((row) => {
          const rowClass = [
            'duty-day-list__row',
            row.isMyDuty ? 'duty-day-list__row--my' : '',
            row.isIncomplete ? 'duty-day-list__row--incomplete' : '',
            selectedDate === row.date ? 'duty-day-list__row--selected' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={row.date}>
              <button
                type="button"
                className={rowClass}
                onClick={() => onSelectDate(row.date)}
                aria-pressed={selectedDate === row.date}
              >
                <span className="duty-day-list__date">
                  <span className="duty-day-list__day-num">{row.dayNum}</span>
                  <span className="duty-day-list__weekday">{row.weekday}</span>
                </span>
                <span className="duty-day-list__shifts">
                  {row.duties.length === 0 ? (
                    <span className="duty-day-list__empty">—</span>
                  ) : (
                    row.duties.map((duty) => (
                      <span
                        key={`${duty.section}-${duty.office}`}
                        className="duty-day-list__shift"
                      >
                        {formatSurnameWithInitials(duty.fullName)}
                        <span className="duty-day-list__office">каб. {duty.office}</span>
                      </span>
                    ))
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
