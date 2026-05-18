import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, id, className = '', ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <label className={`field ${className}`.trim()} htmlFor={inputId}>
        <span className="field__label">{label}</span>
        <input ref={ref} id={inputId} className="field__input" {...props} />
        {error ? <span className="field__error">{error}</span> : null}
      </label>
    );
  },
);

Input.displayName = 'Input';
