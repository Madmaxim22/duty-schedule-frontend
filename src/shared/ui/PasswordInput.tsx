import { forwardRef, useState, type InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.12 5.12M6.61 6.61C3.78 8.4 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.39-.89"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const inputId = id ?? props.name;

    return (
      <label className={`field ${className}`.trim()} htmlFor={inputId}>
        <span className="field__label">{label}</span>
        <div className="field__password-wrap">
          <input
            ref={ref}
            id={inputId}
            className="field__input field__input--password"
            type={visible ? 'text' : 'password'}
            {...props}
          />
          <button
            type="button"
            className="field__password-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={visible}
          >
            <EyeIcon open={!visible} />
          </button>
        </div>
        {error ? <span className="field__error">{error}</span> : null}
      </label>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
