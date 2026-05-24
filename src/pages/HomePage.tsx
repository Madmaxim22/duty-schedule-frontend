import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchUnreadNotificationsCount } from '@/shared/api/notifications';
import { apiRequest } from '@/shared/api/client';
import type { MonthSchedule } from '@/shared/api/types';
import { DutyCalendar } from '@/features/calendar/DutyCalendar';
import { DutyDayList } from '@/features/calendar/DutyDayList';
import {
  loadScheduleView,
  saveScheduleView,
  ScheduleViewToggle,
  type ScheduleView,
} from '@/features/calendar/ScheduleViewToggle';
import { DayDetailModal } from '@/features/day-detail/DayDetailModal';
import { AvatarPreviewModal } from '@/features/day-detail/AvatarPreviewModal';
import type { AvatarPreviewUser } from '@/features/day-detail/avatarPreviewUser';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { UserProfileModal } from '@/features/profile/UserProfileModal';
import { useAuth } from '@/features/auth/AuthContext';
import { SideMenu } from '@/shared/ui/SideMenu';
import { Avatar } from '@/shared/ui/Avatar';
import { ProfileModal } from '@/features/settings/ProfileModal';

function MenuIcon() {
  return (
    <svg width="33" height="33" viewBox="0 0 33 33" fill="none" aria-hidden>
      <path
        d="M4.125 24.75H20.625"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.125 16.5H28.875"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.125 8.25H28.875"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type HomeLocationState = { selectedDate?: string };

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<AvatarPreviewUser | null>(null);
  const [viewedProfile, setViewedProfile] = useState<DutyProfileTarget | null>(null);
  const [scheduleView, setScheduleView] = useState<ScheduleView>(loadScheduleView);

  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', 'month', year, monthNum],
    queryFn: () =>
      apiRequest<MonthSchedule>(`/schedule/month?year=${year}&month=${monthNum}`),
  });

  const unreadNotifications = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationsCount,
  });

  useEffect(() => {
    const date = (location.state as HomeLocationState | null)?.selectedDate;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const [y, m] = date.split('-').map(Number);
    setMonth(new Date(y, m - 1, 1));
    setSelectedDate(date);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  const openProfile = () => {
    closeMenu();
    setProfileOpen(true);
  };

  function handleDutyProfile(target: DutyProfileTarget) {
    if (target.userId === user?.id) {
      setProfileOpen(true);
      return;
    }
    setViewedProfile(target);
  }

  const displayName = user?.fullName ?? '';
  const avatarCacheBust = avatarVersion || undefined;

  const isListView = scheduleView === 'list';

  return (
    <div className={isListView ? 'home-page home-page--list' : 'home-page'}>
      <header className="home-page__header">
        <button
          type="button"
          className="home-page__menu-btn"
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
        </button>
        {displayName && user?.avatarUrl && user.currentPhotoId && user.id ? (
          <button
            type="button"
            className="home-page__header-avatar-btn"
            aria-label={`Показать фото: ${displayName}`}
            onClick={() =>
              setAvatarPreview({
                targetUserId: user.id,
                photoId: user.currentPhotoId!,
                fullName: displayName,
                avatarUrl: user.avatarUrl!,
              })
            }
          >
            <Avatar
              fullName={displayName}
              avatarUrl={user.avatarUrl}
              cacheBust={avatarCacheBust}
              className="home-page__header-avatar"
            />
          </button>
        ) : displayName ? (
          <Avatar
            fullName={displayName}
            avatarUrl={user?.avatarUrl}
            cacheBust={avatarCacheBust}
            className="home-page__header-avatar"
          />
        ) : (
          <span className="avatar avatar--sm avatar--initials">?</span>
        )}
      </header>

      <div className="home-page__schedule-toolbar">
        <ScheduleViewToggle
          view={scheduleView}
          onChange={(view) => {
            setScheduleView(view);
            saveScheduleView(view);
          }}
        />
      </div>

      {isLoading ? <p className="page-loading">Загрузка календаря…</p> : null}

      {!isLoading && scheduleView === 'grid' ? (
        <DutyCalendar
          month={month}
          onMonthChange={(m) => setMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
          days={data?.days ?? []}
          highlightMyDuty={!isAdmin}
          incompleteDates={isAdmin ? data?.monthCoverage?.incompleteDates : undefined}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ) : null}

      {!isLoading && scheduleView === 'list' ? (
        <DutyDayList
          month={month}
          onMonthChange={setMonth}
          days={data?.days ?? []}
          highlightMyDuty={!isAdmin}
          incompleteDates={isAdmin ? data?.monthCoverage?.incompleteDates : undefined}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onDutyProfile={handleDutyProfile}
          onAvatarPreview={setAvatarPreview}
        />
      ) : null}

      <p className="home-page__legend">
        {!isAdmin ? (
          <>
            <span className="home-page__legend-item home-page__legend-item--my">
              Мои дежурства
            </span>
            <span className="home-page__legend-item home-page__legend-item--absent">
              Отсутствие
            </span>
          </>
        ) : (
          <span className="home-page__legend-item home-page__legend-item--incomplete">
            Не заполнен
          </span>
        )}
      </p>

      <SideMenu open={menuOpen} onClose={closeMenu}>
        <button type="button" className="side-menu__user" onClick={openProfile}>
          <Avatar
            fullName={displayName || '?'}
            avatarUrl={user?.avatarUrl}
            size="md"
            cacheBust={avatarCacheBust}
          />
          <div className="side-menu__user-text">
            <p className="side-menu__name">{user?.fullName}</p>
            <p className="side-menu__email">{user?.email}</p>
          </div>
        </button>
        <div className="side-menu__nav">
          {isAdmin ? (
            <ul className="side-menu__actions">
              <li>
                <Link to="/admin/users" className="side-menu__action" onClick={closeMenu}>
                  Пользователи
                </Link>
              </li>
              <li>
                <Link to="/admin/import" className="side-menu__action" onClick={closeMenu}>
                  Импорт графика
                </Link>
              </li>
              <li>
                <Link to="/admin/changes" className="side-menu__action" onClick={closeMenu}>
                  Изменения дежурств
                </Link>
              </li>
            </ul>
          ) : null}
          <ul className="side-menu__actions side-menu__actions--footer">
            <li>
              <Link to="/notifications" className="side-menu__action" onClick={closeMenu}>
                Оповещения
                {(unreadNotifications.data?.count ?? 0) > 0 ? (
                  <span className="side-menu__badge">
                    {unreadNotifications.data!.count > 99
                      ? '99+'
                      : unreadNotifications.data!.count}
                  </span>
                ) : null}
              </Link>
            </li>
            <li>
              <button type="button" className="side-menu__action" onClick={openProfile}>
                Профиль
              </button>
            </li>
            <li>
              <button type="button" className="side-menu__action" onClick={handleLogout}>
                Выйти
              </button>
            </li>
          </ul>
        </div>
      </SideMenu>

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onAvatarUpdated={() => setAvatarVersion(Date.now())}
      />

      <DayDetailModal
        date={selectedDate}
        onClose={() => setSelectedDate(null)}
        onUserProfile={handleDutyProfile}
      />

      <UserProfileModal
        target={viewedProfile}
        onClose={() => setViewedProfile(null)}
      />

      <AvatarPreviewModal
        open={Boolean(avatarPreview)}
        photoId={avatarPreview?.photoId}
        targetUserId={avatarPreview?.targetUserId}
        currentUserId={user?.id}
        fullName={avatarPreview?.fullName ?? ''}
        avatarUrl={avatarPreview?.avatarUrl ?? null}
        avatarCacheBust={
          avatarPreview?.targetUserId === user?.id ? avatarCacheBust : undefined
        }
        onClose={() => setAvatarPreview(null)}
      />
    </div>
  );
}
