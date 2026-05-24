import { THEME_OPTIONS, type AppTheme } from '@/features/settings/theme';

type Props = {
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
};

function CheckIcon() {
  return (
    <svg
      className="theme-picker__check"
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

export function ThemePicker({ theme, onChange }: Props) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Тема оформления">
      {THEME_OPTIONS.map((option) => {
        const isActive = theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${option.label}${isActive ? ', выбрано' : ''}`}
            className={`theme-picker__option${isActive ? ' theme-picker__option--active' : ''}`}
            onClick={() => onChange(option.id)}
          >
            {isActive ? <CheckIcon /> : null}
            <span className="theme-picker__swatch" aria-hidden>
              <span
                className="theme-picker__swatch-primary"
                style={{ background: option.primary }}
              />
              <span
                className="theme-picker__swatch-accent"
                style={{ background: option.accent }}
              />
            </span>
            <span className="theme-picker__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
