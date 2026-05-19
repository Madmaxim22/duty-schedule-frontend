import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/shared/api/client';
import type { MonthSchedule } from '@/shared/api/types';
import { DutyCalendar } from '@/features/calendar/DutyCalendar';
import { DayDetailModal } from '@/features/day-detail/DayDetailModal';
import { useAuth } from '@/features/auth/AuthContext';
import menuIcon from '@/shared/assets/icons/fi_menu.svg';
import { SideMenu } from '@/shared/ui/SideMenu';

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]![0]!.toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  return (
    <div className="home-page">
      <header className="home-page__header">
        <button
          type="button"
          className="home-page__menu-btn"
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <img src={menuIcon} alt="" width={33} height={33} aria-hidden />
        </button>
        <span className="home-page__avatar" aria-label={user?.fullName}>
          {user?.fullName ? getInitials(user.fullName) : '?'}
        </span>
      </header>

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

      <SideMenu open={menuOpen} onClose={closeMenu}>
        <div className="side-menu__user">
          <span className="side-menu__avatar">
            {user?.fullName ? getInitials(user.fullName) : '?'}
          </span>
          <div>
            <p className="side-menu__name">{user?.fullName}</p>
            <p className="side-menu__email">{user?.email}</p>
          </div>
        </div>
        <ul className="side-menu__links">
          {isAdmin ? (
            <li>
              <Link to="/admin/users" className="side-menu__link" onClick={closeMenu}>
                Модерация регистраций
              </Link>
            </li>
          ) : null}
        </ul>
        <button type="button" className="side-menu__logout" onClick={handleLogout}>
          Выйти
        </button>
      </SideMenu>

      <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}
