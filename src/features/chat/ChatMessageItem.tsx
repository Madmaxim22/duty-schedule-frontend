import type { ChatMessage } from '@/shared/api/types';
import { Avatar } from '@/shared/ui/Avatar';
import { toAvatarPreviewUser, type AvatarPreviewUser } from '@/features/day-detail/avatarPreviewUser';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';
import { ChatMessageReactions } from './ChatMessageReactions';
import { ChatMessageReplyQuote } from './ChatMessageReplyQuote';
import type { ChatMessageMenuAnchor } from './ChatMessageOverlay';

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const TICK_LABELS = {
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
} as const;

const TICK_STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

const TICK_SINGLE_PATH = 'M1.5 6.25 4.6 9.35 10.45 2.65';
const TICK_DOUBLE_BACK = 'M0.75 6.25 3.85 9.35 9.2 2.65';
const TICK_DOUBLE_FRONT = 'M5.25 6.25 8.35 9.35 13.7 2.65';

function MessageTicks({ status }: { status: 'sent' | 'delivered' | 'read' }) {
  if (status === 'sent') {
    return (
      <span className="chat-room__ticks chat-room__ticks--sent" role="img" aria-label={TICK_LABELS.sent}>
        <svg className="chat-room__ticks-icon" viewBox="0 0 12 11" width={12} height={11} aria-hidden>
          <path d={TICK_SINGLE_PATH} {...TICK_STROKE} />
        </svg>
      </span>
    );
  }

  return (
    <span
      className={`chat-room__ticks chat-room__ticks--double chat-room__ticks--${status}`}
      role="img"
      aria-label={TICK_LABELS[status]}
    >
      <svg className="chat-room__ticks-icon" viewBox="0 0 18 11" width={18} height={11} aria-hidden>
        <path d={TICK_DOUBLE_BACK} {...TICK_STROKE} />
        <path d={TICK_DOUBLE_FRONT} {...TICK_STROKE} />
      </svg>
    </span>
  );
}

type Props = {
  msg: ChatMessage;
  isMine: boolean;
  isGroup: boolean;
  currentUserId?: string;
  showAvatar: boolean;
  onAvatarPreview: (user: AvatarPreviewUser) => void;
  onUserProfile: (target: DutyProfileTarget) => void;
  onBubbleClick: (msg: ChatMessage, anchor: ChatMessageMenuAnchor) => void;
  onReactionChipClick: (msg: ChatMessage, emoji: string, reactedByMe: boolean) => void;
  onScrollToReply?: (messageId: string) => void;
};

export function ChatMessageItem({
  msg,
  isMine,
  isGroup,
  currentUserId,
  showAvatar,
  onAvatarPreview,
  onUserProfile,
  onBubbleClick,
  onReactionChipClick,
  onScrollToReply,
}: Props) {
  const preview = toAvatarPreviewUser(msg.author);
  const reactions = msg.reactions ?? [];

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

  const avatarSlot = showAvatar ? (
    preview ? (
      <button
        type="button"
        className="chat-room__avatar-btn"
        aria-label={`Показать фото: ${msg.author.fullName}`}
        onClick={openPreview}
      >
        <Avatar
          fullName={msg.author.fullName}
          avatarUrl={msg.author.avatarUrl}
          focusX={msg.author.avatarFocusX}
          focusY={msg.author.avatarFocusY}
          size="sm"
        />
      </button>
    ) : (
      <span className="chat-room__avatar-placeholder" aria-hidden>
        <Avatar
          fullName={msg.author.fullName}
          avatarUrl={msg.author.avatarUrl}
          focusX={msg.author.avatarFocusX}
          focusY={msg.author.avatarFocusY}
          size="sm"
        />
      </span>
    )
  ) : (
    <span className="chat-room__avatar-spacer" aria-hidden />
  );
  const shouldRenderTicks = isMine && !isGroup && Boolean(msg.status);

  const openMenuFromBubble = (
    target: HTMLElement,
    clientX?: number,
    clientY?: number,
  ) => {
    const rect = target.getBoundingClientRect();
    onBubbleClick(msg, {
      rect,
      clientX: clientX ?? rect.left + rect.width / 2,
      clientY: clientY ?? rect.top + rect.height / 2,
    });
  };

  const onBubbleClickHandler = (e: React.MouseEvent<HTMLDivElement>) => {
    openMenuFromBubble(e.currentTarget, e.clientX, e.clientY);
  };

  const onBubbleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openMenuFromBubble(e.currentTarget);
    }
  };

  return (
    <li
      data-chat-message-id={msg.id}
      className={`chat-room__message${isMine ? ' chat-room__message--mine' : ''}${
        isGroup ? ' chat-room__message--group' : ''
      }`}
    >
      {!isMine && isGroup ? avatarSlot : null}
      <div className="chat-room__message-stack">
        <div
          role="button"
          tabIndex={0}
          className="chat-room__bubble"
          onClick={onBubbleClickHandler}
          onKeyDown={onBubbleKeyDown}
          aria-haspopup="dialog"
        >
          {isGroup && !isMine ? (
            <span
              role="link"
              tabIndex={0}
              className="chat-room__author-btn"
              onClick={(e) => {
                e.stopPropagation();
                openProfile();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  openProfile();
                }
              }}
            >
              {msg.author.fullName}
            </span>
          ) : null}
          {msg.replyTo ? (
            <ChatMessageReplyQuote
              replyTo={msg.replyTo}
              currentUserId={currentUserId}
              isDirect={!isGroup}
              className="chat-room__reply-quote--clickable"
              onClick={(e) => {
                e.stopPropagation();
                onScrollToReply?.(msg.replyTo!.id);
              }}
            />
          ) : null}
          <div className="chat-room__bubble-row">
            <p className="chat-room__body">{msg.body}</p>
            <div className="chat-room__bubble-footer">
              <ChatMessageReactions
                reactions={reactions}
                corner
                isDirect={!isGroup}
                onChipClick={(emoji, reactedByMe) => onReactionChipClick(msg, emoji, reactedByMe)}
              />
              <span className="chat-room__meta">
                <time className="chat-room__time" dateTime={msg.createdAt}>
                  {formatBubbleTime(msg.createdAt)}
                </time>
                {shouldRenderTicks && msg.status ? <MessageTicks status={msg.status} /> : null}
              </span>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
