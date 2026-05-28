import type { ChatMessage } from '@/shared/api/types';
import { ChatMessageReplyQuote } from './ChatMessageReplyQuote';

type Props = {
  replyTo: ChatMessage;
  currentUserId?: string;
  isDirect: boolean;
  onCancel: () => void;
  onQuoteClick?: () => void;
};

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChatReplyComposerBar({
  replyTo,
  currentUserId,
  isDirect,
  onCancel,
  onQuoteClick,
}: Props) {
  const quote: NonNullable<ChatMessage['replyTo']> = {
    id: replyTo.id,
    body: replyTo.body,
    author: { id: replyTo.author.id, fullName: replyTo.author.fullName },
  };

  return (
    <div className="chat-room__reply-bar">
      <ChatMessageReplyQuote
        replyTo={quote}
        currentUserId={currentUserId}
        isDirect={isDirect}
        className="chat-room__reply-quote--composer chat-room__reply-quote--clickable"
        clickLabel="Перейти к цитируемому сообщению"
        onClick={
          onQuoteClick
            ? (e) => {
                e.preventDefault();
                onQuoteClick();
              }
            : undefined
        }
      />
      <button
        type="button"
        className="chat-room__reply-bar-close"
        aria-label="Отменить ответ"
        onClick={onCancel}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
