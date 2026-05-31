import { useLayoutEffect, useMemo, useRef, type MouseEvent } from 'react';
import type { MonthDay, MonthDayDuty } from '@/shared/api/types';
import {
  toAvatarPreviewUser,
  type AvatarPreviewUser,
} from '@/features/day-detail/avatarPreviewUser';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Avatar } from '@/shared/ui/Avatar';
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
  onAvatarPreview?: (user: AvatarPreviewUser) => void;
};

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function DutyPerson({
  duty,
  onDutyProfile,
  onAvatarPreview,
}: {
  duty: MonthDayDuty;
  onDutyProfile?: (target: DutyProfileTarget) => void;
  onAvatarPreview?: (user: AvatarPreviewUser) => void;
}) {
  const preview = toAvatarPreviewUser({
    id: duty.userId,
    fullName: duty.fullName,
    avatarUrl: duty.avatarUrl,
    currentPhotoId: duty.currentPhotoId,
  });
  const label = formatSurnameWithInitials(duty.fullName);

  const openPreview = (e: MouseEvent) => {
    e.stopPropagation();
    if (preview && onAvatarPreview) onAvatarPreview(preview);
  };

  const openProfile = (e: MouseEvent) => {
    e.stopPropagation();
    if (onDutyProfile) {
      onDutyProfile({
        userId: duty.userId,
        fullName: duty.fullName,
        avatarUrl: duty.avatarUrl,
        currentPhotoId: duty.currentPhotoId,
        avatarFocusX: duty.avatarFocusX,
        avatarFocusY: duty.avatarFocusY,
      });
    }
  };

  const avatar = (
    <Avatar
      fullName={duty.fullName}
      avatarUrl={duty.avatarUrl}
      focusX={duty.avatarFocusX}
      focusY={duty.avatarFocusY}
      className="duty-day-list__avatar"
    />
  );

  return (
    <span className="duty-day-list__person">
      {preview && onAvatarPreview ? (
        <button
          type="button"
          className="duty-day-list__avatar-btn"
          aria-label={`Показать фото: ${duty.fullName}`}
          onClick={openPreview}
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}
      {onDutyProfile ? (
        <button
          type="button"
          className="duty-day-list__name-btn"
          aria-label={`Профиль: ${duty.fullName}`}
          onClick={openProfile}
        >
          {label}
        </button>
      ) : (
        <span className="duty-day-list__name">{label}</span>
      )}
    </span>
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
  onAvatarPreview,
}: Props) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const todayRef = useRef<HTMLLIElement>(null);
  const rows = useMemo(
    () => buildMonthRows(month, days, incompleteDates),
    [month, days, incompleteDates],
  );

  const todayKey = toDateKey(new Date());
  const isCurrentMonth =
    month.getFullYear() === new Date().getFullYear() &&
    month.getMonth() === new Date().getMonth();

  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    if (!isCurrentMonth) {
      scrollEl.scrollTop = 0;
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    todayRef.current?.scrollIntoView({
      block: 'center',
      behavior: reducedMotion ? 'instant' : 'auto',
    });
  }, [isCurrentMonth, month]);

  return (
    <section className="duty-day-list" aria-label="Расписание по дням">
      <ScheduleMonthNav month={month} onMonthChange={onMonthChange} />
      <ul ref={scrollRef} className="duty-day-list__scroll">
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

          const selectDay = () => onSelectDate(row.date);
          const dayLabel = `${row.dayNum}, ${row.weekday}: открыть день`;

          return (
            <li key={row.date} ref={row.date === todayKey ? todayRef : undefined}>
              <div className={rowClass}>
                <button
                  type="button"
                  className="duty-day-list__date-trigger"
                  onClick={selectDay}
                  aria-pressed={selectedDate === row.date}
                  aria-label={dayLabel}
                >
                  <span className="duty-day-list__date">
                    <span className="duty-day-list__day-num">{row.dayNum}</span>
                    <span className="duty-day-list__weekday">{row.weekday}</span>
                  </span>
                </button>
                <div className="duty-day-list__shifts" onClick={selectDay}>
                  {row.duties.length === 0 ? (
                    <span className="duty-day-list__empty">—</span>
                  ) : (
                    row.duties.map((duty) => (
                      <span
                        key={`${duty.section}-${duty.office}`}
                        className="duty-day-list__shift"
                      >
                        <DutyPerson
                          duty={duty}
                          onDutyProfile={onDutyProfile}
                          onAvatarPreview={onAvatarPreview}
                        />
                        <span className="duty-day-list__office">каб. {duty.office}</span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
