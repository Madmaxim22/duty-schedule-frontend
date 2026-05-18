import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: ReactNode;
};

export function Button({ variant = 'primary', className = '', children, ...props }: Props) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
