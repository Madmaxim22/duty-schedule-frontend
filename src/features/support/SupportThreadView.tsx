import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import {
  closeAdminSupportThread,
  getAdminSupportThread,
  getSupportThread,
  postAdminSupportMessage,
  postSupportMessage,
} from '@/shared/api/support';
import type { SupportMessage } from '@/shared/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import { AvatarPreviewModal } from '@/features/day-detail/AvatarPreviewModal';
import { toAvatarPreviewUser, type AvatarPreviewUser } from '@/features/day-detail/avatarPreviewUser';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { UserProfileModal } from '@/features/profile/UserProfileModal';
import { ProfileModal } from '@/features/settings/ProfileModal';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/Button';

const messageSchema = { min: 1, max: 2000 };

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type SupportThreadViewProps = {
  threadId: string;
  isAdmin: boolean;
};

type SupportMessageItemProps = {
  msg: SupportMessage;
  isMine: boolean;
  isAdminMsg: boolean;
  onAvatarPreview: (user: AvatarPreviewUser) => void;
  onUserProfile: (target: DutyProfileTarget) => void;
};

function SupportMessageItem({
  msg,
  isMine,
  isAdminMsg,
  onAvatarPreview,
  onUserProfile,
}: SupportMessageItemProps) {
  const preview = toAvatarPreviewUser(msg.author);
  const openPreview = () => {
    if (preview) onAvatarPreview(preview);
  };
  const openProfile = () => {
    onUserProfile({
      userId: msg.author.id,
      fullName: msg.author.fullName,
      avatarUrl: msg.author.avatarUrl,
      currentPhotoId: msg.author.currentPhotoId,
      avatarFocusX: msg.author.avatarFocusX,
      avatarFocusY: msg.author.avatarFocusY,
    });
  };

  const avatar = (
    <Avatar
      fullName={msg.author.fullName}
      avatarUrl={msg.author.avatarUrl}
      focusX={msg.author.avatarFocusX}
      focusY={msg.author.avatarFocusY}
      size="sm"
    />
  );

  return (
    <li
      className={`support-thread-page__message${
        isMine ? ' support-thread-page__message--mine' : ''
      }${isAdminMsg ? ' support-thread-page__message--admin' : ''}`}
    >
      {preview ? (
        <button
          type="button"
          className="support-thread-page__avatar-btn"
          aria-label={`Показать фото: ${msg.author.fullName}`}
          onClick={openPreview}
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}
      <div className="support-thread-page__bubble">
        <button type="button" className="support-thread-page__author-btn" onClick={openProfile}>
          {msg.author.fullName}
        </button>
        <p className="support-thread-page__body">{msg.body}</p>
        <time className="support-thread-page__time" dateTime={msg.createdAt}>
          {formatTime(msg.createdAt)}
        </time>
      </div>
    </li>
  );
}

export function SupportThreadView({ threadId, isAdmin }: SupportThreadViewProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<AvatarPreviewUser | null>(null);
  const [viewedProfile, setViewedProfile] = useState<DutyProfileTarget | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const listEndRef = useRef<HTMLDivElement>(null);

  const queryKey = isAdmin ? ['admin', 'support', threadId] : ['support', 'thread', threadId];

  const threadQuery = useQuery({
    queryKey,
    queryFn: () => (isAdmin ? getAdminSupportThread(threadId) : getSupportThread(threadId)),
  });

  const postMutation = useMutation({
    mutationFn: (body: string) =>
      isAdmin ? postAdminSupportMessage(threadId, body) : postSupportMessage(threadId, body),
    onSuccess: () => {
      setDraft('');
      setError('');
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({
        queryKey: isAdmin ? ['admin', 'support', 'list'] : ['support', 'threads'],
      });
    },
    onError: (e: Error) => setError(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: () => closeAdminSupportThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'support', 'list'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const thread = threadQuery.data?.thread;
  const messages = threadQuery.data?.messages ?? [];
  const isClosed = thread?.status === 'closed';
  const backTo = isAdmin ? '/admin/support' : '/support';
  const avatarCacheBust = avatarVersion || undefined;

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (body.length < messageSchema.min || body.length > messageSchema.max) {
      setError('Введите сообщение от 1 до 2000 символов');
      return;
    }
    postMutation.mutate(body);
  }

  const isBusy = postMutation.isPending || closeMutation.isPending;

  return (
    <div className="support-thread-page">
      <header className="subpage-header">
        <Link to={backTo} className="subpage-header__back" aria-label="Назад к списку">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">
          {isAdmin && thread ? thread.author.fullName : 'Обращение'}
        </h1>
        {thread ? (
          <span
            className={`support-page__status support-page__status--${thread.status}`}
            aria-label={isClosed ? 'Закрыто' : 'Открыто'}
          >
            {isClosed ? 'Закрыто' : 'Открыто'}
          </span>
        ) : null}
      </header>

      {threadQuery.isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {threadQuery.error ? (
        <p className="form-message form-message--error">{(threadQuery.error as Error).message}</p>
      ) : null}

      {!threadQuery.isLoading && !threadQuery.error ? (
        <>
          <ul className="support-thread-page__messages" aria-live="polite">
            {messages.map((msg) => (
              <SupportMessageItem
                key={msg.id}
                msg={msg}
                isMine={msg.author.id === user?.id}
                isAdminMsg={msg.author.role === 'admin'}
                onAvatarPreview={setAvatarPreview}
                onUserProfile={handleUserProfile}
              />
            ))}
            <div ref={listEndRef} />
          </ul>

          {isAdmin && !isClosed ? (
            <div className="support-thread-page__admin-actions">
              <Button
                variant="secondary"
                disabled={isBusy}
                onClick={() => closeMutation.mutate()}
              >
                {closeMutation.isPending ? '…' : 'Закрыть обращение'}
              </Button>
            </div>
          ) : null}

          {isClosed ? (
            <p className="support-thread-page__closed-hint">
              Обращение закрыто. Новые сообщения отправить нельзя.
            </p>
          ) : (
            <form className="support-thread-page__composer" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="support-message">
                Сообщение
              </label>
              <textarea
                id="support-message"
                className="support-thread-page__input"
                rows={3}
                maxLength={2000}
                placeholder="Введите сообщение…"
                value={draft}
                disabled={isBusy}
                onChange={(e) => setDraft(e.target.value)}
              />
              {error ? <p className="form-message form-message--error">{error}</p> : null}
              <Button type="submit" disabled={isBusy || !draft.trim()}>
                {postMutation.isPending ? '…' : 'Отправить'}
              </Button>
            </form>
          )}
        </>
      ) : null}

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

      <UserProfileModal target={viewedProfile} onClose={() => setViewedProfile(null)} />

      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onAvatarUpdated={() => setAvatarVersion(Date.now())}
      />
    </div>
  );
}
