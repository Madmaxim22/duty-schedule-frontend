import type { ReactNode } from 'react';

type Props = {
  titleId: string;
  title: string;
  className?: string;
  children: ReactNode;
};

export function SettingsSection({ titleId, title, className, children }: Props) {
  const sectionClass = className
    ? `settings-page__section ${className}`
    : 'settings-page__section';

  return (
    <section className={sectionClass} aria-labelledby={titleId}>
      <h2 id={titleId} className="settings-page__section-title">
        {title}
      </h2>
      {children}
    </section>
  );
}
