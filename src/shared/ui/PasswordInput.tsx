import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import eyeVisibleIcon from '@/shared/assets/icons/Eye Visible.svg';
import eyeInvisibleIcon from '@/shared/assets/icons/Eye Invisible.svg';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
};

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
            <img
              src={visible ? eyeInvisibleIcon : eyeVisibleIcon}
              alt=""
              width={20}
              height={20}
              aria-hidden
            />
          </button>
        </div>
        {error ? <span className="field__error">{error}</span> : null}
      </label>
    );
  },
);

PasswordInput.displayName = 'PasswordInput';
