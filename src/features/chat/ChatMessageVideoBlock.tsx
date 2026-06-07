import type { ChatAttachment } from '@/shared/api/types';
import { formatVideoDuration } from './chatAttachmentUtils';

type Props = {
  attachments: ChatAttachment[];
  onOpenAttachment?: (attachmentId: string) => void;
};

export function ChatMessageVideoBlock({ attachments, onOpenAttachment }: Props) {
  if (!attachments.length) return null;

  return (
    <div className="chat-room__videos">
      {attachments.map((att) => {
        const duration = formatVideoDuration(att.durationMs);
        const maxWidth = att.width && att.height
          ? `min(280px, 72vw, ${Math.round((280 * att.width) / att.height)}px)`
          : 'min(280px, 72vw)';

        return (
          <button
            key={att.id}
            type="button"
            className="chat-room__video-link"
            style={{ maxWidth }}
            aria-label={`Открыть видео: ${att.fileName}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAttachment?.(att.id);
            }}
          >
            <span className="chat-room__video-poster-wrap">
              <img
                src={att.posterUrl ?? att.url}
                alt=""
                className="chat-room__video-poster"
                loading="lazy"
                draggable={false}
              />
              <span className="chat-room__video-play" aria-hidden>
                ▶
              </span>
              {duration ? (
                <span className="chat-room__video-duration" aria-hidden>
                  {duration}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
