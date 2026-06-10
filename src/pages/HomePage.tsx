import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchChatUnreadCount } from '@/shared/api/chat';
import { listMyDutySwaps } from '@/shared/api/duty-swaps';
import { fetchUnreadNotificationsCount } from '@/shared/api/notifications';
import { fetchOnboarding } from '@/shared/api/onboarding';
import { apiRequest } from '@/shared/api/client';
import type { MonthSchedule } from '@/shared/api/types';
import { DutyCalendar } from '@/features/calendar/DutyCalendar';
import { DutyDayList } from '@/features/calendar/DutyDayList';
import { DutyMatrixView } from '@/features/calendar/DutyMatrixView';
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
import { AppVersionFooter } from '@/features/onboarding/AppVersionFooter';
import { useMediaMinMd } from '@/shared/hooks/useMediaMinMd';

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

  const scheduleQuery = useQuery({
    queryKey: ['schedule', 'month', year, monthNum],
    queryFn: () =>
      apiRequest<MonthSchedule>(`/schedule/month?year=${year}&month=${monthNum}`),
    placeholderData: keepPreviousData,
  });

  const scheduleData = scheduleQuery.data;
  const showInitialScheduleLoading = scheduleQuery.isLoading && !scheduleData;
  const isScheduleRefreshing =
    scheduleQuery.isFetching && !showInitialScheduleLoading;
  const scheduleStatusMessage = showInitialScheduleLoading
    ? 'Загрузка календаря…'
    : isScheduleRefreshing
      ? 'Обновление расписания…'
      : '';

  const unreadNotifications = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationsCount,
  });

  const unreadChat = useQuery({
    queryKey: ['chat', 'unread-count'],
    queryFn: fetchChatUnreadCount,
  });

  const onboardingQuery = useQuery({
    queryKey: ['onboarding'],
    queryFn: fetchOnboarding,
    staleTime: 60_000,
  });

  const incomingSwaps = useQuery({
    queryKey: ['duty-swaps', 'mine', 'incoming', 'pending_counterparty'],
    queryFn: () =>
      listMyDutySwaps({ role: 'incoming', status: 'pending_counterparty' }),
    enabled: !isAdmin,
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
  const unreadNotificationsCount = unreadNotifications.data?.count ?? 0;
  const unreadChatCount = unreadChat.data?.count ?? 0;
  const incomingSwapCount = incomingSwaps.data?.requests.length ?? 0;
  const releaseNeedsAck = onboardingQuery.data?.release?.needsAck ?? false;
  const menuBadgeTotal = unreadNotificationsCount + unreadChatCount + incomingSwapCount;

  function formatBadgeCount(n: number) {
    return n > 99 ? '99+' : n;
  }

  function menuAriaLabel() {
    if (menuBadgeTotal === 0) return 'Меню';
    const parts: string[] = [];
    if (unreadNotificationsCount > 0) {
      parts.push(`оповещений: ${unreadNotificationsCount}`);
    }
    if (unreadChatCount > 0) {
      parts.push(`сообщений в чатах: ${unreadChatCount}`);
    }
    return `Меню, непрочитанных ${parts.join(', ')}`;
  }

  const isMinMd = useMediaMinMd();
  const matrixAvailable = isMinMd;
  const effectiveView =
    scheduleView === 'matrix' && !matrixAvailable ? 'list' : scheduleView;
  const isListView = effectiveView === 'list';
  const isMatrixView = effectiveView === 'matrix' && matrixAvailable;

  const homePageClass = isMatrixView
    ? 'home-page home-page--matrix'
    : isListView
      ? 'home-page home-page--list'
      : 'home-page';

  return (
    <div className={homePageClass}>
      <header className="home-page__header">
        <button
          type="button"
          className="home-page__menu-btn"
          aria-label={menuAriaLabel()}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
          {menuBadgeTotal > 0 ? (
            <span className="home-page__menu-badge" aria-hidden="true">
              {formatBadgeCount(menuBadgeTotal)}
            </span>
          ) : null}
        </button>
        <div className="home-page__schedule-toolbar">
          <ScheduleViewToggle
            view={scheduleView}
            matrixDisabled={!matrixAvailable}
            onChange={(view) => {
              setScheduleView(view);
              saveScheduleView(view);
            }}
          />
        </div>
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
                focusX: user.avatarFocusX,
                focusY: user.avatarFocusY,
              })
            }
          >
            <Avatar
              fullName={displayName}
              avatarUrl={user.avatarUrl}
              focusX={user.avatarFocusX}
              focusY={user.avatarFocusY}
              cacheBust={avatarCacheBust}
              className="home-page__header-avatar"
            />
          </button>
        ) : displayName ? (
          <Avatar
            fullName={displayName}
            avatarUrl={user?.avatarUrl}
            focusX={user?.avatarFocusX}
            focusY={user?.avatarFocusY}
            cacheBust={avatarCacheBust}
            className="home-page__header-avatar"
          />
        ) : (
          <span className="avatar avatar--sm avatar--initials">?</span>
        )}
      </header>

      {!matrixAvailable && scheduleView === 'matrix' ? (
        <p className="home-page__matrix-fallback" role="status">
          Вид «Таблица» доступен на экране от 768px. Показан список.
        </p>
      ) : null}

      <div
        className="home-page__schedule"
        aria-busy={scheduleQuery.isFetching || undefined}
      >
        <p className="visually-hidden" aria-live="polite">
          {scheduleStatusMessage}
        </p>

        {showInitialScheduleLoading ? (
          <p className="page-loading home-page__schedule-placeholder">
            Загрузка календаря…
          </p>
        ) : null}

        {!showInitialScheduleLoading && effectiveView === 'grid' ? (
          <div
            className={
              isScheduleRefreshing
                ? 'home-page__schedule-view home-page__schedule-view--loading'
                : 'home-page__schedule-view'
            }
          >
            <DutyCalendar
              month={month}
              onMonthChange={(m) => setMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
              days={scheduleData?.days ?? []}
              highlightMyDuty={!isAdmin}
              incompleteDates={
                isAdmin ? scheduleData?.monthCoverage?.incompleteDates : undefined
              }
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>
        ) : null}

        {!showInitialScheduleLoading && effectiveView === 'list' ? (
          <div
            className={
              isScheduleRefreshing
                ? 'home-page__schedule-view home-page__schedule-view--loading'
                : 'home-page__schedule-view'
            }
          >
            <DutyDayList
              month={month}
              onMonthChange={setMonth}
              days={scheduleData?.days ?? []}
              highlightMyDuty={!isAdmin}
              incompleteDates={
                isAdmin ? scheduleData?.monthCoverage?.incompleteDates : undefined
              }
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onDutyProfile={handleDutyProfile}
              onAvatarPreview={setAvatarPreview}
            />
          </div>
        ) : null}

        {!showInitialScheduleLoading && isMatrixView && scheduleData ? (
          <div
            className={
              isScheduleRefreshing
                ? 'home-page__schedule-view home-page__schedule-view--loading'
                : 'home-page__schedule-view'
            }
          >
            <DutyMatrixView
              month={month}
              onMonthChange={(m) => setMonth(new Date(m.getFullYear(), m.getMonth(), 1))}
              schedule={scheduleData}
              isAdmin={isAdmin}
              currentUserId={user?.id}
              onSelectDate={setSelectedDate}
              isRefreshing={isScheduleRefreshing}
            />
          </div>
        ) : null}
      </div>

      {!isMatrixView ? (
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
            <>
              <span className="home-page__legend-item home-page__legend-item--incomplete">
                Не заполнен
              </span>
              <span className="home-page__legend-item home-page__legend-item--absent">
                Отсутствие
              </span>
            </>
          )}
        </p>
      ) : null}

      <SideMenu open={menuOpen} onClose={closeMenu}>
        <button type="button" className="side-menu__user" onClick={openProfile}>
          <Avatar
            fullName={displayName || '?'}
            avatarUrl={user?.avatarUrl}
            focusX={user?.avatarFocusX}
            focusY={user?.avatarFocusY}
            size="md"
            cacheBust={avatarCacheBust}
          />
          <div className="side-menu__user-text">
            <p className="side-menu__name">{user?.fullName}</p>
            <p className="side-menu__email">{user?.email}</p>
          </div>
        </button>
        <div className="side-menu__nav">
          <ul className="side-menu__actions">
            <li>
              <button type="button" className="side-menu__action" onClick={openProfile}>
                Профиль
              </button>
            </li>
            <li>
              <Link to="/chat" className="side-menu__action" onClick={closeMenu}>
                Чаты
                {unreadChatCount > 0 ? (
                  <span className="side-menu__badge">{formatBadgeCount(unreadChatCount)}</span>
                ) : null}
              </Link>
            </li>
            <li>
              <Link to="/notifications" className="side-menu__action" onClick={closeMenu}>
                Оповещения
                {unreadNotificationsCount > 0 ? (
                  <span className="side-menu__badge">
                    {formatBadgeCount(unreadNotificationsCount)}
                  </span>
                ) : null}
              </Link>
            </li>
            {!isAdmin ? (
              <li>
                <Link to="/duty-swaps" className="side-menu__action" onClick={closeMenu}>
                  Смена дежурств
                  {incomingSwapCount > 0 ? (
                    <span className="side-menu__badge">{formatBadgeCount(incomingSwapCount)}</span>
                  ) : null}
                </Link>
              </li>
            ) : null}
            {!isAdmin ? (
              <li>
                <Link to="/support" className="side-menu__action" onClick={closeMenu}>
                  Обращения
                </Link>
              </li>
            ) : null}
            <li>
              <Link to="/payroll" className="side-menu__action" onClick={closeMenu}>
                Калькулятор довольствия
              </Link>
            </li>
          </ul>
          {isAdmin ? (
            <ul className="side-menu__actions">
              <li>
                <Link to="/admin/support" className="side-menu__action" onClick={closeMenu}>
                  Обращения пользователей
                </Link>
              </li>
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
                <Link to="/admin/absences" className="side-menu__action" onClick={closeMenu}>
                  Отсутствия
                </Link>
              </li>
              <li>
                <Link to="/admin/changes" className="side-menu__action" onClick={closeMenu}>
                  Изменения дежурств
                </Link>
              </li>
              <li>
                <Link to="/admin/duty-swaps" className="side-menu__action" onClick={closeMenu}>
                  Заявки на смену
                </Link>
              </li>
              <li>
                <Link to="/admin/statistics" className="side-menu__action" onClick={closeMenu}>
                  Статистика
                </Link>
              </li>
            </ul>
          ) : null}
          <ul className="side-menu__actions side-menu__actions--footer">
            <li>
              <Link to="/updates" className="side-menu__action" onClick={closeMenu}>
                Обновления
                {releaseNeedsAck ? (
                  <span className="side-menu__badge" aria-label="Новое обновление">
                    !
                  </span>
                ) : null}
              </Link>
            </li>
            <li>
              <Link to="/settings" className="side-menu__action" onClick={closeMenu}>
                Настройки
              </Link>
            </li>
            <li>
              <button type="button" className="side-menu__action" onClick={handleLogout}>
                Выйти
              </button>
            </li>
          </ul>
        </div>
        <AppVersionFooter />
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
        focusX={avatarPreview?.focusX}
        focusY={avatarPreview?.focusY}
        avatarCacheBust={
          avatarPreview?.targetUserId === user?.id ? avatarCacheBust : undefined
        }
        onClose={() => setAvatarPreview(null)}
      />
    </div>
  );
}
