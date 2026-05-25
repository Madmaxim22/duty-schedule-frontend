import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import {
  getChatMessages,
  getChatRoom,
  markChatRoomRead,
  postChatMessage,
} from '@/shared/api/chat';
import { useAuth } from '@/features/auth/AuthContext';
import { AvatarPreviewModal } from '@/features/day-detail/AvatarPreviewModal';
import type { AvatarPreviewUser } from '@/features/day-detail/avatarPreviewUser';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { UserProfileModal } from '@/features/profile/UserProfileModal';
import { ProfileModal } from '@/features/settings/ProfileModal';
import { Avatar } from '@/shared/ui/Avatar';
import { ChatMessageItem } from './ChatMessageItem';
import { groupMessagesByDate } from './chatMessageGroups';
import { formatTypingLabel } from './formatTypingLabel';
import { useChatSocket } from './ChatSocketContext';
import { useChatTypingEmitter } from './useChatTypingEmitter';

const messageSchema = { min: 1, max: 2000 };

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"
        fill="currentColor"
      />
    </svg>
  );
}

type Props = {
  roomId: string;
};

export function ChatRoomView({ roomId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { subscribe, unsubscribe, getTypingUserIds } = useChatSocket();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<AvatarPreviewUser | null>(null);
  const [viewedProfile, setViewedProfile] = useState<DutyProfileTarget | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const roomQuery = useQuery({
    queryKey: ['chat', 'room', roomId],
    queryFn: () => getChatRoom(roomId),
  });

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', roomId],
    queryFn: () => getChatMessages(roomId),
  });

  const readMutation = useMutation({
    mutationFn: () => markChatRoomRead(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    },
  });

  const postMutation = useMutation({
    mutationFn: (body: string) => postChatMessage(roomId, body),
    onSuccess: (data) => {
      setDraft('');
      setError('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '';
      }
      queryClient.setQueryData(['chat', 'messages', roomId], (old: typeof messagesQuery.data) => {
        if (!old) return { messages: [data.message], nextBefore: null };
        if (old.messages.some((m) => m.id === data.message.id)) return old;
        return { ...old, messages: [...old.messages, data.message] };
      });
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const room = roomQuery.data?.room;
  const messages = messagesQuery.data?.messages ?? [];
  const isGroup = room?.type === 'group';
  const messageGroups = groupMessagesByDate(messages);

  useChatTypingEmitter(roomId, draft);

  const typingUserIds = getTypingUserIds(roomId);
  const typingLabel = useMemo(() => {
    if (!room || typingUserIds.length === 0) return null;
    const names = typingUserIds
      .map((id) => room.members.find((m) => m.id === id)?.fullName)
      .filter((n): n is string => Boolean(n));
    return formatTypingLabel(names);
  }, [room, typingUserIds]);

  useEffect(() => {
    subscribe([roomId]);
    readMutation.mutate();
    return () => {
      unsubscribe([roomId]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function handleUserProfile(target: DutyProfileTarget) {
    if (target.userId === user?.id) {
      setProfileOpen(true);
      return;
    }
    setViewedProfile(target);
  }

  function handleTextareaInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (body.length < messageSchema.min || body.length > messageSchema.max) {
      setError('Введите сообщение от 1 до 2000 символов');
      return;
    }
    postMutation.mutate(body);
  }

  const isBusy = postMutation.isPending;
  const avatarCacheBust = avatarVersion || undefined;
  const canSend = !isBusy && draft.trim().length > 0;

  return (
    <div className="chat-room chat-room--telegram">
      <header className="chat-room__header">
        <Link to="/chat" className="chat-room__back" aria-label="Назад к чатам">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        {room ? (
          <div className="chat-room__header-main">
            <Avatar
              fullName={room.displayName}
              avatarUrl={room.displayAvatarUrl}
              size="sm"
            />
            <div className="chat-room__header-text">
              <h1 className="chat-room__title">{room.displayName}</h1>
              {typingLabel ? (
                <p className="chat-room__subtitle chat-room__subtitle--typing" role="status">
                  {typingLabel}
                </p>
              ) : isGroup ? (
                <p className="chat-room__subtitle">
                  {room.members.length} участник
                  {room.members.length === 1 ? '' : room.members.length < 5 ? 'а' : 'ов'}
                </p>
              ) : (
                <p className="chat-room__subtitle">в сети</p>
              )}
            </div>
          </div>
        ) : (
          <h1 className="chat-room__title">Чат</h1>
        )}
      </header>

      <div className="chat-room__body-wrap">
        {roomQuery.isLoading || messagesQuery.isLoading ? (
          <p className="chat-room__loading">Загрузка…</p>
        ) : null}
        {roomQuery.error || messagesQuery.error ? (
          <p className="form-message form-message--error chat-room__error">
            {((roomQuery.error ?? messagesQuery.error) as Error).message}
          </p>
        ) : null}

        {!roomQuery.isLoading && !messagesQuery.isLoading && !roomQuery.error && !messagesQuery.error ? (
          <ul className="chat-room__messages" aria-live="polite">
            {messageGroups.map((group) => (
              <li key={group.dateKey} className="chat-room__day-group">
                <div className="chat-room__date-badge" role="separator">
                  {group.dateLabel}
                </div>
                <ul className="chat-room__day-messages">
                  {group.messages.map((msg, index) => {
                    const prev = group.messages[index - 1];
                    const showAvatar =
                      isGroup &&
                      msg.author.id !== user?.id &&
                      (!prev || prev.author.id !== msg.author.id);

                    return (
                      <ChatMessageItem
                        key={msg.id}
                        msg={msg}
                        isMine={msg.author.id === user?.id}
                        isGroup={isGroup}
                        showAvatar={showAvatar}
                        onAvatarPreview={setAvatarPreview}
                        onUserProfile={handleUserProfile}
                      />
                    );
                  })}
                </ul>
              </li>
            ))}
            <div ref={listEndRef} />
          </ul>
        ) : null}
      </div>

      {!roomQuery.isLoading && !roomQuery.error ? (
        <form className="chat-room__composer" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="chat-message">
            Сообщение
          </label>
          <div className="chat-room__composer-field">
            <textarea
              ref={textareaRef}
              id="chat-message"
              className="chat-room__input"
              rows={1}
              maxLength={2000}
              placeholder="Сообщение"
              value={draft}
              disabled={isBusy}
              onChange={(e) => {
                setDraft(e.target.value);
                handleTextareaInput();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) {
                    handleSubmit(e);
                  }
                }
              }}
            />
            <button
              type="submit"
              className="chat-room__send"
              disabled={!canSend}
              aria-label="Отправить"
            >
              <SendIcon />
            </button>
          </div>
          {error ? <p className="form-message form-message--error chat-room__composer-error">{error}</p> : null}
        </form>
      ) : null}

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

      <UserProfileModal target={viewedProfile} onClose={() => setViewedProfile(null)} />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onAvatarUpdated={() => setAvatarVersion(Date.now())}
      />
    </div>
  );
}
