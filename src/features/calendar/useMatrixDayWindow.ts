import { useMemo } from 'react';
import { addMonths, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { toDateKey } from '@/shared/lib/dateKey';

type Options = {
  month: Date;
};

export function useMatrixDayWindow({ month }: Options) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  return useMemo(() => {
    const prevMonth = subMonths(month, 1);
    const nextMonth = addMonths(month, 1);
    const prevDays = getDaysInMonth(prevMonth);
    const currDays = getDaysInMonth(month);
    const nextDays = getDaysInMonth(nextMonth);

    return {
      windowStart: toDateKey(startOfMonth(prevMonth)),
      visibleDays: prevDays + currDays + nextDays,
      currentMonthStartIndex: prevDays,
      currentMonthDayCount: currDays,
    };
  }, [year, monthIndex]);
}
