import type { ChatMessage } from '@/shared/api/types';
import { Avatar } from '@/shared/ui/Avatar';
import { toAvatarPreviewUser, type AvatarPreviewUser } from '@/features/day-detail/avatarPreviewUser';
import type { DutyProfileTarget } from '@/features/profile/dutyProfileTarget';

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

/** Одна галочка — отправлено. */
const TICK_SINGLE_PATH = 'M1.5 6.25 4.6 9.35 10.45 2.65';

/** Две галочки с наложением — доставлено / прочитано (как в Telegram). */
const TICK_DOUBLE_BACK = 'M0.75 6.25 3.85 9.35 9.2 2.65';
const TICK_DOUBLE_FRONT = 'M5.25 6.25 8.35 9.35 13.7 2.65';

/** Галочки в стиле Telegram: одна / две с наложением, синие при прочтении. */
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
  showAvatar: boolean;
  onAvatarPreview: (user: AvatarPreviewUser) => void;
  onUserProfile: (target: DutyProfileTarget) => void;
};

export function ChatMessageItem({
  msg,
  isMine,
  isGroup,
  showAvatar,
  onAvatarPreview,
  onUserProfile,
}: Props) {
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
        <Avatar fullName={msg.author.fullName} avatarUrl={msg.author.avatarUrl} size="sm" />
      </button>
    ) : (
      <span className="chat-room__avatar-placeholder" aria-hidden>
        <Avatar fullName={msg.author.fullName} avatarUrl={msg.author.avatarUrl} size="sm" />
      </span>
    )
  ) : (
    <span className="chat-room__avatar-spacer" aria-hidden />
  );
  const shouldRenderTicks = isMine && !isGroup && Boolean(msg.status);

  return (
    <li
      className={`chat-room__message${isMine ? ' chat-room__message--mine' : ''}${
        isGroup ? ' chat-room__message--group' : ''
      }`}
    >
      {!isMine && isGroup ? avatarSlot : null}
      <div className="chat-room__bubble">
        {isGroup && !isMine ? (
          <button type="button" className="chat-room__author-btn" onClick={openProfile}>
            {msg.author.fullName}
          </button>
        ) : null}
        <div className="chat-room__bubble-row">
          <p className="chat-room__body">{msg.body}</p>
          <span className="chat-room__meta">
            <time className="chat-room__time" dateTime={msg.createdAt}>
              {formatBubbleTime(msg.createdAt)}
            </time>
            {shouldRenderTicks && msg.status ? <MessageTicks status={msg.status} /> : null}
          </span>
        </div>
      </div>
    </li>
  );
}
