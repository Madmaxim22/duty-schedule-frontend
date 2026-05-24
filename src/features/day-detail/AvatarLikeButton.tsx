type Props = {
  liked: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const HEART_PATH =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="avatar-preview__like-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d={HEART_PATH}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AvatarLikeButton({ liked, label, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      className={`avatar-preview__like${liked ? ' avatar-preview__like--active' : ''}`}
      aria-label={label}
      aria-pressed={liked}
      disabled={disabled}
      onClick={onClick}
    >
      <HeartIcon filled={liked} />
    </button>
  );
}
