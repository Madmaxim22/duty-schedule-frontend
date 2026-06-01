import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/shared/api/notifications';
import type { NotificationItem } from '@/shared/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';
import { formatChangeSource } from '@/shared/lib/formatDutyChange';

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function notificationMeta(item: NotificationItem): string | null {
  if (item.type === 'duty_change' && item.payload?.source) {
    return formatChangeSource(item.payload.source);
  }
  if (item.type === 'user_registration') {
    return 'Регистрация';
  }
  if (item.type === 'support_message') {
    return 'Обращение';
  }
  if (item.type === 'chat_message') {
    return 'Чат';
  }
  if (item.type === 'duty_swap') {
    return 'Смена дежурств';
  }
  if (item.type === 'photo_like') {
    return 'Лайк';
  }
  return null;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationsCount,
  });

  const listQuery = useInfiniteQuery({
    queryKey: ['notifications', 'list'],
    queryFn: ({ pageParam }) => fetchNotifications(50, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = listQuery.data?.pages.flatMap((p) => p.notifications) ?? [];
  const unreadCount = unreadQuery.data?.count ?? 0;
  const isBusy = markReadMutation.isPending || markAllMutation.isPending;

  async function handleItemClick(item: NotificationItem) {
    if (!item.readAt) {
      await markReadMutation.mutateAsync(item.id);
    }

    if (item.type === 'user_registration' && isAdmin) {
      navigate('/admin/users');
      return;
    }

    if (item.type === 'support_message' && item.payload?.threadId) {
      if (isAdmin) {
        navigate(`/admin/support/${item.payload.threadId}`);
      } else {
        navigate(`/support/${item.payload.threadId}`);
      }
      return;
    }

    if (item.type === 'duty_change' && item.payload?.dutyDate) {
      if (isAdmin) {
        navigate(`/admin/schedule/${item.payload.dutyDate}`);
      } else {
        navigate('/', { state: { selectedDate: item.payload.dutyDate } });
      }
      return;
    }

    if (item.type === 'duty_swap') {
      if (isAdmin) {
        navigate('/admin/duty-swaps');
      } else if (item.payload?.chatRoomId) {
        navigate(`/chat/${item.payload.chatRoomId}`);
      } else {
        navigate('/duty-swaps');
      }
    }
  }

  return (
    <div className="notifications-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Оповещения</h1>
        {unreadCount > 0 ? (
          <span className="notifications-page__badge" aria-label={`Непрочитанных: ${unreadCount}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </header>

      {unreadCount > 0 ? (
        <div className="notifications-page__toolbar">
          <Button
            variant="secondary"
            disabled={isBusy}
            onClick={() => markAllMutation.mutate()}
          >
            {markAllMutation.isPending ? '…' : 'Прочитать все'}
          </Button>
        </div>
      ) : null}

      {listQuery.isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {listQuery.error ? (
        <p className="form-message form-message--error">{(listQuery.error as Error).message}</p>
      ) : null}

      {!listQuery.isLoading && !listQuery.error && notifications.length === 0 ? (
        <p className="notifications-page__empty">Пока нет оповещений</p>
      ) : null}

      {!listQuery.isLoading && !listQuery.error && notifications.length > 0 ? (
        <ul className="notifications-page__list">
          {notifications.map((item) => {
            const meta = notificationMeta(item);
            const isUnread = !item.readAt;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`notifications-page__item${isUnread ? ' notifications-page__item--unread' : ''}`}
                  disabled={isBusy}
                  onClick={() => void handleItemClick(item)}
                >
                  {item.actor ? (
                    <Avatar
                      fullName={item.actor.fullName}
                      avatarUrl={item.actor.avatarUrl}
                      focusX={item.actor.avatarFocusX}
                      focusY={item.actor.avatarFocusY}
                      size="sm"
                    />
                  ) : (
                    <span className="notifications-page__icon" aria-hidden>
                      •
                    </span>
                  )}
                  <span className="notifications-page__content">
                    <span className="notifications-page__body">{item.body}</span>
                    <span className="notifications-page__meta">
                      {meta ? <span className="notifications-page__tag">{meta}</span> : null}
                      <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {listQuery.hasNextPage ? (
        <Button
          variant="secondary"
          className="notifications-page__more"
          disabled={listQuery.isFetchingNextPage}
          onClick={() => listQuery.fetchNextPage()}
        >
          {listQuery.isFetchingNextPage ? 'Загрузка…' : 'Загрузить ещё'}
        </Button>
      ) : null}
    </div>
  );
}
