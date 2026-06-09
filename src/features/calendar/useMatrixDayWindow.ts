import { useEffect, useState } from 'react';
import { startOfMonth } from 'date-fns';
import { shiftDateKey, toDateKey } from '@/shared/lib/dateKey';
import { useMediaMinMd } from '@/shared/hooks/useMediaMinMd';

const MIN_VISIBLE_DAYS = 3;
const HORIZONTAL_PADDING = 24;

function calcVisibleDays(viewportWidth: number, isMd: boolean): number {
  const corner = Math.min(Math.max(viewportWidth * 0.18, 112), 176);
  const dayCol = isMd
    ? Math.min(Math.max(viewportWidth * 0.04, 40), 52)
    : Math.min(Math.max(viewportWidth * 0.05, 36), 48);
  const available = viewportWidth - corner - HORIZONTAL_PADDING;
  return Math.max(MIN_VISIBLE_DAYS, Math.floor(available / dayCol));
}

type Options = {
  month: Date;
};

export function useMatrixDayWindow({ month }: Options) {
  const isMd = useMediaMinMd();
  const [visibleDays, setVisibleDays] = useState(() =>
    typeof window === 'undefined' ? MIN_VISIBLE_DAYS : calcVisibleDays(window.innerWidth, isMd),
  );
  const [windowStart, setWindowStart] = useState(() =>
    toDateKey(startOfMonth(month)),
  );

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  useEffect(() => {
    const update = () => setVisibleDays(calcVisibleDays(window.innerWidth, isMd));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isMd]);

  useEffect(() => {
    setWindowStart(toDateKey(startOfMonth(month)));
  }, [year, monthIndex]);

  const goPrev = () => setWindowStart((prev) => shiftDateKey(prev, -1));
  const goNext = () => setWindowStart((prev) => shiftDateKey(prev, 1));

  return {
    windowStart,
    visibleDays,
    goPrev,
    goNext,
  };
}
