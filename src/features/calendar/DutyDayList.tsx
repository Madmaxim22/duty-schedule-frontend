import { useMemo } from 'react';
import type { MonthDay, MonthDayDuty } from '@/shared/api/types';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { buildMonthRows } from './buildMonthRows';
import { ScheduleMonthNav } from './ScheduleMonthNav';

type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
  days: MonthDay[];
  highlightMyDuty?: boolean;
  incompleteDates?: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onDutyProfile?: (target: DutyProfileTarget) => void;
};

function DutyName({
  duty,
  onDutyProfile,
}: {
  duty: MonthDayDuty;
  onDutyProfile?: (target: DutyProfileTarget) => void;
}) {
  const label = formatSurnameWithInitials(duty.fullName);

  if (!onDutyProfile) {
    return <span className="duty-day-list__name">{label}</span>;
  }

  return (
    <button
      type="button"
      className="duty-day-list__name-btn"
      aria-label={`Профиль: ${duty.fullName}`}
      onClick={(e) => {
        e.stopPropagation();
        onDutyProfile({
          userId: duty.userId,
          fullName: duty.fullName,
          avatarUrl: duty.avatarUrl,
          currentPhotoId: duty.currentPhotoId,
        });
      }}
    >
      {label}
    </button>
  );
}

export function DutyDayList({
  month,
  onMonthChange,
  days,
  highlightMyDuty = true,
  incompleteDates,
  selectedDate,
  onSelectDate,
  onDutyProfile,
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
            highlightMyDuty && row.isMyDuty ? 'duty-day-list__row--my' : '',
            row.isAbsent ? 'duty-day-list__row--absent' : '',
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
                        <DutyName duty={duty} onDutyProfile={onDutyProfile} />
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
