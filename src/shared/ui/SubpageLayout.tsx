import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';

type Props = {
  title: string;
  backTo?: string;
  backLabel?: string;
  className?: string;
  headerExtra?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function SubpageLayout({
  title,
  backTo = '/',
  backLabel = 'Назад к календарю',
  className,
  headerExtra,
  footer,
  children,
}: Props) {
  const rootClass = className ? `subpage ${className}` : 'subpage';

  return (
    <div className={rootClass}>
      <header className="subpage-header">
        <Link to={backTo} className="subpage-header__back" aria-label={backLabel}>
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">{title}</h1>
        {headerExtra}
      </header>

      <main className="subpage-main">{children}</main>

      {footer ? <footer className="subpage-footer">{footer}</footer> : null}
    </div>
  );
}
