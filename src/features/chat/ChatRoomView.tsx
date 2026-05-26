import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import {
  getChatMessages,
  getChatRoom,
  markChatRoomRead,
  postChatMessage,
  removeChatMessageReaction,
  setChatMessageReaction,
} from '@/shared/api/chat';
import type { ChatMessage } from '@/shared/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import { AvatarPreviewModal } from '@/features/day-detail/AvatarPreviewModal';
import { toAvatarPreviewUser, type AvatarPreviewUser } from '@/features/day-detail/avatarPreviewUser';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { UserProfileModal } from '@/features/profile/UserProfileModal';
import { ProfileModal } from '@/features/settings/ProfileModal';
import { Avatar } from '@/shared/ui/Avatar';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatMessageOverlay } from './ChatMessageOverlay';
import { groupMessagesByDate } from './chatMessageGroups';
import { getDirectPeerLastReadAt } from './chatMessageMenuActions';
import { formatTypingLabel } from './formatTypingLabel';
import {
  appendMessageToChatPagesAfterPost,
  mergeChatPages,
  updateMessageReactions,
  type ChatMessagesPage,
} from './chatMessagesCache';
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
  const [activeMessageMenu, setActiveMessageMenu] = useState<{
    message: ChatMessage;
    anchorRect: DOMRect;
  } | null>(null);
  const [emojiExpanded, setEmojiExpanded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLUListElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prependSnapshotRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const prevFirstIdRef = useRef<string | undefined>(undefined);
  const prevLastIdRef = useRef<string | undefined>(undefined);
  const topFetchCooldownUntilRef = useRef(0);
  const allowOlderFetchRef = useRef(true);

  const roomQuery = useQuery({
    queryKey: ['chat', 'room', roomId],
    queryFn: () => getChatRoom(roomId),
  });

  const messagesQuery = useInfiniteQuery({
    queryKey: ['chat', 'messages', roomId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => getChatMessages(roomId, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextBefore ?? undefined,
  });

  const readMutation = useMutation({
    mutationFn: () => markChatRoomRead(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'unread-count'] });
    },
  });

  const closeMessageMenu = useCallback(() => {
    setActiveMessageMenu(null);
    setEmojiExpanded(false);
  }, []);

  const applyMessageReactions = useCallback(
    (messageId: string, reactions: ChatMessage['reactions']) => {
      queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
        ['chat', 'messages', roomId],
        (old) => updateMessageReactions(old, messageId, reactions) ?? old,
      );
    },
    [queryClient, roomId],
  );

  const setReactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      setChatMessageReaction(roomId, messageId, emoji),
    onSuccess: (data, { messageId }) => {
      applyMessageReactions(messageId, data.reactions);
      closeMessageMenu();
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: (messageId: string) => removeChatMessageReaction(roomId, messageId),
    onSuccess: (data, messageId) => {
      applyMessageReactions(messageId, data.reactions);
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
      queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
        ['chat', 'messages', roomId],
        (old) => appendMessageToChatPagesAfterPost(old, data.message),
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'rooms'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const room = roomQuery.data?.room;
  const messages = useMemo(() => mergeChatPages(messagesQuery.data), [messagesQuery.data]);
  const isGroup = room?.type === 'group';
  const directPeer = useMemo(() => {
    if (!room || room.type !== 'direct' || !user?.id) return null;
    return room.members.find((m) => m.id !== user.id) ?? null;
  }, [room, user?.id]);
  const directPeerPreview = directPeer ? toAvatarPreviewUser(directPeer) : null;
  const messageGroups = groupMessagesByDate(messages);
  const hasNextPage = Boolean(messagesQuery.hasNextPage);
  const isFetchingNextPage = messagesQuery.isFetchingNextPage;

  const fetchNextPage = messagesQuery.fetchNextPage;
  const hasOlderPage = messagesQuery.hasNextPage;
  const loadingOlder = messagesQuery.isFetchingNextPage;

  const tryFetchOlder = useCallback(() => {
    if (!hasOlderPage || loadingOlder) return;
    if (Date.now() < topFetchCooldownUntilRef.current) return;
    if (!allowOlderFetchRef.current) return;
    const root = scrollRef.current;
    if (!root) return;
    allowOlderFetchRef.current = false;
    topFetchCooldownUntilRef.current = Date.now() + 450;
    prependSnapshotRef.current = { scrollHeight: root.scrollHeight, scrollTop: root.scrollTop };
    void fetchNextPage();
  }, [hasOlderPage, loadingOlder, fetchNextPage]);

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
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    closeMessageMenu();
  }, [roomId, closeMessageMenu]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || !activeMessageMenu) return;
    const onScroll = () => closeMessageMenu();
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [activeMessageMenu, closeMessageMenu]);

  useEffect(() => {
    subscribe([roomId]);
    readMutation.mutate();
    return () => {
      unsubscribe([roomId]);
      void markChatRoomRead(roomId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleBubbleClick = useCallback((msg: ChatMessage, anchorRect: DOMRect) => {
    setEmojiExpanded(false);
    setActiveMessageMenu({ message: msg, anchorRect });
  }, []);

  const handleReactionChipClick = useCallback(
    (msg: ChatMessage, emoji: string, reactedByMe: boolean) => {
      if (reactedByMe) {
        removeReactionMutation.mutate(msg.id);
      } else {
        setReactionMutation.mutate({ messageId: msg.id, emoji });
      }
    },
    [removeReactionMutation, setReactionMutation],
  );

  const handleOverlayEmoji = useCallback(
    (emoji: string) => {
      if (!activeMessageMenu) return;
      setReactionMutation.mutate({ messageId: activeMessageMenu.message.id, emoji });
    },
    [activeMessageMenu, setReactionMutation],
  );

  const messageMenuContext = useMemo(() => {
    if (!activeMessageMenu || !room || !user?.id) return null;
    return {
      message: activeMessageMenu.message,
      isMine: activeMessageMenu.message.author.id === user.id,
      isDirect: room.type === 'direct',
      peerLastReadAt: getDirectPeerLastReadAt(room.members, user.id),
    };
  }, [activeMessageMenu, room, user?.id]);

  useEffect(() => {
    prevFirstIdRef.current = undefined;
    prevLastIdRef.current = undefined;
    prependSnapshotRef.current = null;
    allowOlderFetchRef.current = true;
  }, [roomId]);

  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = topSentinelRef.current;
    if (!root || !sentinel || !hasNextPage) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (!e.isIntersecting) {
          allowOlderFetchRef.current = true;
          return;
        }
        tryFetchOlder();
      },
      { root, rootMargin: '160px 0px 0px 0px', threshold: 0 },
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [hasNextPage, tryFetchOlder, roomId, messagesQuery.data?.pages.length]);

  useLayoutEffect(() => {
    const root = scrollRef.current;
    const snap = prependSnapshotRef.current;
    if (snap && !isFetchingNextPage) {
      if (root) {
        const delta = root.scrollHeight - snap.scrollHeight;
        root.scrollTop = snap.scrollTop + delta;
      }
      prependSnapshotRef.current = null;
      const first = messages[0]?.id;
      const last = messages[messages.length - 1]?.id;
      prevFirstIdRef.current = first;
      prevLastIdRef.current = last;
      return;
    }

    if (messages.length === 0) return;
    const firstId = messages[0].id;
    const lastId = messages[messages.length - 1].id;

    if (prevLastIdRef.current === undefined) {
      listEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else if (lastId !== prevLastIdRef.current && firstId === prevFirstIdRef.current) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevFirstIdRef.current = firstId;
    prevLastIdRef.current = lastId;
  }, [messages, isFetchingNextPage]);

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
            {directPeer && directPeerPreview ? (
              <button
                type="button"
                className="chat-room__header-avatar-btn"
                aria-label={`Показать фото: ${directPeer.fullName}`}
                onClick={() => setAvatarPreview(directPeerPreview)}
              >
                <Avatar
                  fullName={room.displayName}
                  avatarUrl={room.displayAvatarUrl}
                  size="sm"
                />
              </button>
            ) : (
              <Avatar
                fullName={room.displayName}
                avatarUrl={room.displayAvatarUrl}
                size="sm"
              />
            )}
            <div className="chat-room__header-text">
              {directPeer ? (
                <button
                  type="button"
                  className="chat-room__title-btn"
                  onClick={() =>
                    handleUserProfile({
                      userId: directPeer.id,
                      fullName: directPeer.fullName,
                      avatarUrl: directPeer.avatarUrl,
                      currentPhotoId: directPeer.currentPhotoId,
                    })
                  }
                >
                  {room.displayName}
                </button>
              ) : (
                <h1 className="chat-room__title">{room.displayName}</h1>
              )}
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
          <ul ref={scrollRef} className="chat-room__messages" aria-live="polite">
            {hasNextPage ? (
              <li className="chat-room__messages-top" aria-busy={isFetchingNextPage}>
                {isFetchingNextPage ? (
                  <div className="chat-room__messages-spinner" role="status">
                    Загрузка…
                  </div>
                ) : null}
                <div
                  ref={topSentinelRef}
                  className="chat-room__messages-sentinel"
                  aria-hidden
                />
              </li>
            ) : null}
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
                        msg={{ ...msg, reactions: msg.reactions ?? [] }}
                        isMine={msg.author.id === user?.id}
                        isGroup={isGroup}
                        showAvatar={showAvatar}
                        onAvatarPreview={setAvatarPreview}
                        onUserProfile={handleUserProfile}
                        onBubbleClick={handleBubbleClick}
                        onReactionChipClick={handleReactionChipClick}
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

      <ChatMessageOverlay
        open={Boolean(activeMessageMenu)}
        message={activeMessageMenu?.message ?? null}
        anchorRect={activeMessageMenu?.anchorRect ?? null}
        menuContext={messageMenuContext}
        emojiExpanded={emojiExpanded}
        onEmojiExpandedChange={setEmojiExpanded}
        onSelectEmoji={handleOverlayEmoji}
        onClose={closeMessageMenu}
        onToast={setToast}
      />

      {toast ? (
        <div className="chat-room__toast" role="status">
          {toast}
        </div>
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
