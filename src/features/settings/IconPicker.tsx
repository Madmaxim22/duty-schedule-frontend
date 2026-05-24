import {
  PWA_ICON_OPTIONS,
  pwaIconBasePath,
  type PwaIconId,
} from '@/features/settings/pwa-icon';

type Props = {
  iconId: PwaIconId;
  onChange: (id: PwaIconId) => void;
};

function CheckIcon() {
  return (
    <svg
      className="icon-picker__check"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPicker({ iconId, onChange }: Props) {
  return (
    <div className="icon-picker" role="radiogroup" aria-label="Иконка приложения">
      {PWA_ICON_OPTIONS.map((option) => {
        const isActive = iconId === option.id;
        const preview = `${pwaIconBasePath(option.id)}/icon-192.png`;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.label}: ${option.description}${isActive ? ', выбрано' : ''}`}
            className={`icon-picker__option${isActive ? ' icon-picker__option--active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            {isActive ? <CheckIcon /> : null}
            <img
              className="icon-picker__preview"
              src={preview}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
            />
            <span className="icon-picker__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
