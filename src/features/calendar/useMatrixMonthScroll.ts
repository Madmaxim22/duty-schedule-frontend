import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { getDaysInMonth, subMonths } from 'date-fns';

type Options = {
  month: Date;
  onMonthChange: (month: Date) => void;
  currentMonthStartIndex: number;
  currentMonthDayCount: number;
};

function shiftMonth(month: Date, delta: number) {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}

function measureDayColWidth(scrollEl: HTMLElement): number {
  const head = scrollEl.querySelector<HTMLElement>('.duty-matrix__date-head');
  if (!head) return 44;
  return head.getBoundingClientRect().width;
}

function scrollToColumn(
  el: HTMLElement,
  colIndex: number,
  behavior: ScrollBehavior = 'auto',
) {
  const colWidth = measureDayColWidth(el);
  if (colWidth <= 0) return;

  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
  const centered = colIndex * colWidth - el.clientWidth / 2 + colWidth / 2;
  el.scrollTo({ left: Math.min(maxScroll, Math.max(0, centered)), behavior });
}

export function useMatrixMonthScroll({
  month,
  onMonthChange,
  currentMonthStartIndex,
  currentMonthDayCount,
}: Options) {
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const monthRef = useRef(month);
  const onMonthChangeRef = useRef(onMonthChange);
  const pendingScrollColRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);

  monthRef.current = month;
  onMonthChangeRef.current = onMonthChange;

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollElRef.current = node;
  }, []);

  useLayoutEffect(() => {
    const el = scrollElRef.current;
    if (!el) return;

    if (pendingScrollColRef.current !== null) {
      const col = pendingScrollColRef.current;
      pendingScrollColRef.current = null;
      scrollToColumn(el, col, 'auto');
      transitioningRef.current = false;
      return;
    }

    const colWidth = measureDayColWidth(el);
    if (colWidth <= 0) return;

    el.scrollLeft = currentMonthStartIndex * colWidth;
    transitioningRef.current = false;
  }, [month, currentMonthStartIndex]);

  useEffect(() => {
    const el = scrollElRef.current;
    if (!el) return;

    let rafId = 0;

    const checkBoundary = () => {
      if (transitioningRef.current) return;

      const colWidth = measureDayColWidth(el);
      if (colWidth <= 0) return;

      const centerCol = (el.scrollLeft + el.clientWidth / 2) / colWidth;
      const currentMonth = monthRef.current;

      if (centerCol < currentMonthStartIndex) {
        const dayInMonth = Math.floor(centerCol);
        const newMonth = shiftMonth(currentMonth, -1);
        const newPrevDays = getDaysInMonth(subMonths(newMonth, 1));

        transitioningRef.current = true;
        pendingScrollColRef.current = newPrevDays + dayInMonth;
        onMonthChangeRef.current(newMonth);
        return;
      }

      if (centerCol >= currentMonthStartIndex + currentMonthDayCount) {
        const dayInMonth = Math.floor(centerCol) - (currentMonthStartIndex + currentMonthDayCount);
        const newMonth = shiftMonth(currentMonth, 1);
        const newPrevDays = getDaysInMonth(subMonths(newMonth, 1));

        transitioningRef.current = true;
        pendingScrollColRef.current = newPrevDays + dayInMonth;
        onMonthChangeRef.current(newMonth);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(checkBoundary);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [currentMonthStartIndex, currentMonthDayCount]);

  return scrollRef;
}
