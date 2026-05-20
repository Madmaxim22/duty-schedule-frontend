import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, deleteAvatar, uploadAvatar } from '@/shared/api/client';
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
import { useAuth } from '@/features/auth/AuthContext';
import menuIcon from '@/shared/assets/icons/fi_menu.svg';
import { SideMenu } from '@/shared/ui/SideMenu';
import { Avatar } from '@/shared/ui/Avatar';
import { SettingsModal } from '@/features/settings/SettingsModal';

export function HomePage() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [scheduleView, setScheduleView] = useState<ScheduleView>(loadScheduleView);

  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  const isAdmin = user?.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['schedule', 'month', year, monthNum],
    queryFn: () =>
      apiRequest<MonthSchedule>(`/schedule/month?year=${year}&month=${monthNum}`),
  });

  const avatarUploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updatedUser) => {
      setAvatarError(null);
      setAvatarVersion(Date.now());
      setUser(updatedUser);
    },
    onError: (err: Error) => setAvatarError(err.message),
  });

  const avatarDeleteMutation = useMutation({
    mutationFn: deleteAvatar,
    onSuccess: (updatedUser) => {
      setAvatarError(null);
      setAvatarVersion(Date.now());
      setUser(updatedUser);
    },
    onError: (err: Error) => setAvatarError(err.message),
  });

  const isAvatarBusy = avatarUploadMutation.isPending || avatarDeleteMutation.isPending;

  const closeMenu = () => {
    setMenuOpen(false);
    setAvatarMenuOpen(false);
  };

  useEffect(() => {
    if (!avatarMenuOpen) return;

    function handlePointerDown(e: PointerEvent) {
      if (avatarMenuRef.current?.contains(e.target as Node)) return;
      setAvatarMenuOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAvatarMenuOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [avatarMenuOpen]);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  const openSettings = () => {
    closeMenu();
    setSettingsOpen(true);
  };

  function openAvatarPicker() {
    setAvatarError(null);
    setAvatarMenuOpen(false);
    fileInputRef.current?.click();
  }

  function handleDeleteAvatar() {
    setAvatarMenuOpen(false);
    avatarDeleteMutation.mutate();
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    avatarUploadMutation.mutate(file);
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
          <img src={menuIcon} alt="" width={33} height={33} aria-hidden />
        </button>
        {displayName ? (
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="visually-hidden"
        onChange={handleAvatarFileChange}
      />

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
        />
      ) : null}

      <p className="home-page__legend">
        {!isAdmin ? (
          <span className="home-page__legend-item home-page__legend-item--my">Мои дежурства</span>
        ) : (
          <span className="home-page__legend-item home-page__legend-item--incomplete">
            Не заполнен
          </span>
        )}
      </p>

      <SideMenu open={menuOpen} onClose={closeMenu}>
        <div className="side-menu__user">
          <div ref={avatarMenuRef} className="side-menu__avatar-wrap">
            <button
              type="button"
              className="side-menu__avatar-btn"
              disabled={isAvatarBusy}
              aria-label="Меню фото профиля"
              aria-expanded={avatarMenuOpen}
              aria-haspopup="menu"
              onClick={() => setAvatarMenuOpen((open) => !open)}
            >
              <Avatar
                fullName={displayName || '?'}
                avatarUrl={user?.avatarUrl}
                size="md"
                cacheBust={avatarCacheBust}
              />
            </button>
            {avatarMenuOpen ? (
              <div className="side-menu__avatar-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="side-menu__avatar-menu-item"
                  disabled={isAvatarBusy}
                  onClick={openAvatarPicker}
                >
                  {isAvatarBusy ? 'Загрузка…' : user?.avatarUrl ? 'Сменить фото' : 'Добавить фото'}
                </button>
                {user?.avatarUrl ? (
                  <button
                    type="button"
                    role="menuitem"
                    className="side-menu__avatar-menu-item side-menu__avatar-menu-item--danger"
                    disabled={isAvatarBusy}
                    onClick={handleDeleteAvatar}
                  >
                    Удалить фото
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <div>
            <p className="side-menu__name">{user?.fullName}</p>
            <p className="side-menu__email">{user?.email}</p>
            {avatarError ? (
              <p className="form-message form-message--error side-menu__avatar-error">
                {avatarError}
              </p>
            ) : null}
          </div>
        </div>
        <div className="side-menu__nav">
          {isAdmin ? (
            <ul className="side-menu__actions">
              <li>
                <Link to="/admin/users" className="side-menu__action" onClick={closeMenu}>
                  Пользователи
                </Link>
              </li>
            </ul>
          ) : null}
          <ul className="side-menu__actions side-menu__actions--footer">
            <li>
              <button type="button" className="side-menu__action" onClick={openSettings}>
                Настройки
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

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <DayDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
    </div>
  );
}
