import { THEME_OPTIONS, type AppTheme } from '@/features/settings/theme';

type Props = {
  theme: AppTheme;
  onChange: (theme: AppTheme) => void;
};

export function ThemePicker({ theme, onChange }: Props) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Тема оформления">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={theme === option.id}
          className={`theme-picker__option${theme === option.id ? ' theme-picker__option--active' : ''}`}
          onClick={() => onChange(option.id)}
        >
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
      ))}
    </div>
  );
}
