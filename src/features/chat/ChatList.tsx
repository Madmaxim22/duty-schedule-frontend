import { Link } from 'react-router-dom';
import type { ChatRoomListItem } from '@/shared/api/types';
import { Avatar } from '@/shared/ui/Avatar';

function formatListTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = (today.getTime() - msgDay.getTime()) / 86400000;

  if (diff === 0) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff === 1) return 'вчера';
  if (diff < 7) {
    return d.toLocaleDateString('ru-RU', { weekday: 'short' });
  }
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function RoomCard({ room }: { room: ChatRoomListItem }) {
  const hasUnread = room.unreadCount > 0;

  return (
    <Link to={`/chat/${room.id}`} className={`chat-page__row${hasUnread ? ' chat-page__row--unread' : ''}`}>
      <div className="chat-page__row-avatar">
        {room.type === 'direct' ? (
          <Avatar fullName={room.displayName} avatarUrl={room.displayAvatarUrl} size="md" />
        ) : (
          <span className="chat-page__group-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
                fill="currentColor"
              />
            </svg>
          </span>
        )}
      </div>
      <div className="chat-page__row-body">
        <div className="chat-page__row-top">
          <span className="chat-page__row-title">{room.displayName}</span>
          {room.lastMessageAt ? (
            <time className="chat-page__row-time" dateTime={room.lastMessageAt}>
              {formatListTime(room.lastMessageAt)}
            </time>
          ) : null}
        </div>
        <div className="chat-page__row-bottom">
          <p className="chat-page__row-preview">
            {room.lastMessagePreview ?? 'Нет сообщений'}
          </p>
          {hasUnread ? (
            <span className="chat-page__unread" aria-label={`Непрочитанных: ${room.unreadCount}`}>
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type Props = {
  rooms: ChatRoomListItem[];
  loading?: boolean;
};

export function ChatList({ rooms, loading }: Props) {
  if (loading) {
    return (
      <ul className="chat-page__list chat-page__list--skeleton" aria-busy="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <li key={i} className="chat-page__skeleton-row" />
        ))}
      </ul>
    );
  }

  if (rooms.length === 0) {
    return <p className="chat-page__empty">Пока нет чатов. Нажмите «+», чтобы начать.</p>;
  }

  return (
    <ul className="chat-page__list">
      {rooms.map((room) => (
        <li key={room.id}>
          <RoomCard room={room} />
        </li>
      ))}
    </ul>
  );
}
