import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChatMessage } from '@/shared/api/types';
import {
  CHAT_REACTION_EMOJIS_MORE,
  CHAT_REACTION_EMOJIS_QUICK,
} from './chat-reactions.constants';
import {
  buildChatMessageMenuActions,
  runChatMessageMenuAction,
  type ChatMessageMenuContext,
} from './chatMessageMenuActions';

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Props = {
  open: boolean;
  message: ChatMessage | null;
  anchorRect: DOMRect | null;
  menuContext: ChatMessageMenuContext | null;
  emojiExpanded: boolean;
  onEmojiExpandedChange: (expanded: boolean) => void;
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
  onToast: (message: string) => void;
};

export function ChatMessageOverlay({
  open,
  message,
  anchorRect,
  menuContext,
  emojiExpanded,
  onEmojiExpandedChange,
  onSelectEmoji,
  onClose,
  onToast,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardStyle, setCardStyle] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRect || !cardRef.current) {
      setCardStyle(null);
      return;
    }

    const card = cardRef.current;
    const cardWidth = card.offsetWidth;
    const cardHeight = card.offsetHeight;
    const margin = 12;

    let left = anchorRect.left + anchorRect.width / 2 - cardWidth / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

    let top = anchorRect.top - cardHeight - 8;
    if (top < margin) {
      top = anchorRect.bottom + 8;
    }
    if (top + cardHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - cardHeight - margin);
    }

    setCardStyle({ top, left });
  }, [open, anchorRect, emojiExpanded, message?.id]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !message || !anchorRect || !menuContext) return null;

  const visibleEmojis = emojiExpanded
    ? [...CHAT_REACTION_EMOJIS_QUICK, ...CHAT_REACTION_EMOJIS_MORE]
    : CHAT_REACTION_EMOJIS_QUICK;

  const menuActions = buildChatMessageMenuActions(menuContext).filter((a) => !a.hidden);

  return createPortal(
    <div className="chat-message-overlay" role="presentation">
      <button
        type="button"
        className="chat-message-overlay__backdrop"
        aria-label="Закрыть меню"
        onClick={onClose}
      />
      <div
        ref={cardRef}
        className="chat-message-overlay__card"
        style={cardStyle ? { top: cardStyle.top, left: cardStyle.left } : { visibility: 'hidden' }}
        role="dialog"
        aria-label="Действия с сообщением"
        onClick={(e) => e.stopPropagation()}
      >
        <section className="chat-message-overlay__emoji-panel" aria-label="Реакции">
          <div
            className={`chat-message-overlay__emoji-grid${
              emojiExpanded ? ' chat-message-overlay__emoji-grid--expanded' : ''
            }`}
          >
            {visibleEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="chat-message-overlay__emoji-btn"
                aria-label={`Реакция ${emoji}`}
                onClick={() => onSelectEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
            {!emojiExpanded && CHAT_REACTION_EMOJIS_MORE.length > 0 ? (
              <button
                type="button"
                className="chat-message-overlay__emoji-more"
                aria-label="Показать больше реакций"
                aria-expanded={emojiExpanded}
                onClick={() => onEmojiExpandedChange(true)}
              >
                <ChevronDownIcon />
              </button>
            ) : null}
          </div>
        </section>

        {!emojiExpanded ? (
          <section className="chat-message-overlay__menu-panel" aria-label="Действия">
            <ul className="chat-message-overlay__actions">
              {menuActions.map((action) => (
                <li key={action.id}>
                  <button
                    type="button"
                    className={`chat-message-overlay__action${
                      action.danger ? ' chat-message-overlay__action--danger' : ''
                    }${action.id === 'read' ? ' chat-message-overlay__action--meta' : ''}`}
                    disabled={action.id === 'read'}
                    onClick={() => {
                      void runChatMessageMenuAction(action.id, menuContext, onToast, onClose);
                    }}
                  >
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
