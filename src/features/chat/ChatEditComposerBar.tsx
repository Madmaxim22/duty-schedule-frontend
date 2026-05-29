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

type Props = {
  onCancel: () => void;
};

export function ChatEditComposerBar({ onCancel }: Props) {
  return (
    <div className="chat-room__reply-bar chat-room__reply-bar--edit">
      <span className="chat-room__edit-bar-label">Редактирование</span>
      <button
        type="button"
        className="chat-room__reply-bar-close"
        aria-label="Отменить редактирование"
        onClick={onCancel}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
