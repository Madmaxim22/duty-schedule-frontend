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

const OVERLAY_MARGIN = 12;
const OVERLAY_GAP = 8;

export type ChatMessageMenuAnchor = {
  rect: DOMRect;
  clientX: number;
  clientY: number;
};

/** Панель по центру точки нажатия; вертикально — над/под тапом с clamp по viewport. */
function computeOverlayCardPosition(
  anchor: ChatMessageMenuAnchor,
  cardWidth: number,
  cardHeight: number,
): { top: number; left: number } {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let left = anchor.clientX - cardWidth / 2;
  left = Math.max(OVERLAY_MARGIN, Math.min(left, viewportW - cardWidth - OVERLAY_MARGIN));

  const clickY = Math.max(
    anchor.rect.top,
    Math.min(anchor.clientY, anchor.rect.bottom),
  );
  const clampedY = Math.max(OVERLAY_MARGIN, Math.min(clickY, viewportH - OVERLAY_MARGIN));

  const spaceAbove = clampedY - OVERLAY_MARGIN - OVERLAY_GAP;
  const spaceBelow = viewportH - OVERLAY_MARGIN - clampedY - OVERLAY_GAP;

  let top: number;
  if (spaceAbove >= cardHeight) {
    top = clampedY - cardHeight - OVERLAY_GAP;
  } else if (spaceBelow >= cardHeight) {
    top = clampedY + OVERLAY_GAP;
  } else if (spaceAbove >= spaceBelow) {
    top = clampedY - cardHeight - OVERLAY_GAP;
  } else {
    top = clampedY + OVERLAY_GAP;
  }

  top = Math.max(OVERLAY_MARGIN, Math.min(top, viewportH - cardHeight - OVERLAY_MARGIN));

  return { top, left };
}

type Props = {
  open: boolean;
  message: ChatMessage | null;
  anchor: ChatMessageMenuAnchor | null;
  menuContext: ChatMessageMenuContext | null;
  emojiExpanded: boolean;
  onEmojiExpandedChange: (expanded: boolean) => void;
  onSelectEmoji: (emoji: string, fromRect: DOMRect) => void;
  onClose: () => void;
  onToast: (message: string) => void;
  onReply?: (message: ChatMessage) => void;
};

export function ChatMessageOverlay({
  open,
  message,
  anchor,
  menuContext,
  emojiExpanded,
  onEmojiExpandedChange,
  onSelectEmoji,
  onClose,
  onToast,
  onReply,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardStyle, setCardStyle] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchor || !cardRef.current) {
      setCardStyle(null);
      return;
    }

    const card = cardRef.current;
    setCardStyle(
      computeOverlayCardPosition(anchor, card.offsetWidth, card.offsetHeight),
    );
  }, [open, anchor, message?.id, emojiExpanded]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open || !message || !anchor || !menuContext) return null;

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
                onClick={(e) => {
                  const btn = e.currentTarget;
                  btn.classList.add('chat-message-overlay__emoji-btn--picked');
                  onSelectEmoji(emoji, btn.getBoundingClientRect());
                }}
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
                      void runChatMessageMenuAction(action.id, menuContext, onToast, onClose, onReply);
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
