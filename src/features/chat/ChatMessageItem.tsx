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
          <time className="chat-room__time" dateTime={msg.createdAt}>
            {formatBubbleTime(msg.createdAt)}
          </time>
        </div>
      </div>
    </li>
  );
}
