import { DayPicker } from 'react-day-picker';
import { ru } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import type { MonthDay } from '@/shared/api/types';

type Props = {
  month: Date;
  onMonthChange: (month: Date) => void;
  days: MonthDay[];
  incompleteDates?: string[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DutyCalendar({
  month,
  onMonthChange,
  days,
  incompleteDates,
  selectedDate,
  onSelectDate,
}: Props) {
  const myDutySet = new Set(days.filter((d) => d.isMyDuty).map((d) => d.date));
  const incompleteSet = new Set(incompleteDates ?? []);

  return (
    <DayPicker
      mode="single"
      locale={ru}
      month={month}
      onMonthChange={onMonthChange}
      navLayout="around"
      showOutsideDays
      className="duty-calendar"
      modifiers={{
        myDuty: (date) => myDutySet.has(toDateKey(date)),
        incomplete: (date) => incompleteSet.has(toDateKey(date)),
      }}
      modifiersClassNames={{
        myDuty: 'duty-calendar__day--my',
        incomplete: 'duty-calendar__day--incomplete',
      }}
      selected={selectedDate ? new Date(`${selectedDate}T12:00:00`) : undefined}
      onDayClick={(day) => onSelectDate(toDateKey(day))}
    />
  );
}
