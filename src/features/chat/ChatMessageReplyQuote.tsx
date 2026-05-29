import type { ChatMessageReplyTo } from '@/shared/api/types';
import { getReplyQuoteAuthorLabel, truncateReplyPreview } from './chatReplyQuote';

type Props = {
  replyTo: ChatMessageReplyTo;
  currentUserId?: string;
  isDirect: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  clickLabel?: string;
};

export function ChatMessageReplyQuote({
  replyTo,
  currentUserId,
  isDirect,
  className = '',
  onClick,
  clickLabel = 'Перейти к сообщению',
}: Props) {
  const authorLabel = getReplyQuoteAuthorLabel(replyTo, currentUserId, isDirect);
  const preview = truncateReplyPreview(replyTo.body);

  const isDeletedQuote = replyTo.body === 'Сообщение удалено';

  return (
    <div
      className={`chat-room__reply-quote${isDeletedQuote ? ' chat-room__reply-quote--deleted' : ''}${
        className ? ` ${className}` : ''
      }`}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? clickLabel : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent);
              }
            }
          : undefined
      }
    >
      <span className="chat-room__reply-quote-author">{authorLabel}</span>
      <span className="chat-room__reply-quote-body">{preview}</span>
    </div>
  );
}
