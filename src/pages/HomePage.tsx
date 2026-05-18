import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type { MonthSchedule } from '@/shared/api/types';
import { DutyCalendar } from '@/features/calendar/DutyCalendar';
import { DayDetailModal } from '@/features/day-detail/DayDetailModal';
import { useAuth } from '@/features/auth/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/Button';

export function HomePage() {
  const { user, logout } = useAuth();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', 'month', year, monthNum],
    queryFn: () =>
      apiRequest<MonthSchedule>(`/schedule/month?year=${year}&month=${monthNum}`),
  });

  const monthLabel = month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div>
          <h1 className="home-page__title">График дежурств</h1>
          <p className="home-page__user">{user?.fullName}</p>
        </div>
        <div className="home-page__actions">
          {user?.role === 'admin' ? (
            <Link to="/admin/users" className="home-page__link">
              Модерация
            </Link>
          ) : null}
          <Button variant="ghost" onClick={() => logout()}>
            Выйти
          </Button>
        </div>
      </header>

      <p className="home-page__month">{monthLabel}</p>

      {isLoading ? <p className="page-loading">Загрузка календаря…</p> : null}

      <DutyCalendar
        month={month}
        onMonthChange={(m) => setMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
        days={data?.days ?? []}
        incompleteDates={isAdmin ? data?.monthCoverage?.incompleteDates : undefined}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <p className="home-page__legend">
        <span className="home-page__legend-item home-page__legend-item--my">Мои дежурства</span>
        {isAdmin ? (
          <span className="home-page__legend-item home-page__legend-item--incomplete">
            Не заполнен
          </span>
        ) : null}
      </p>

      <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}
