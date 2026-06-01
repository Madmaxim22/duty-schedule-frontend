import type { ReleaseNotesItem } from '@/shared/api/types';

type Props = {
  release: Pick<ReleaseNotesItem, 'title' | 'publishedAt' | 'items' | 'version'>;
  isCurrent?: boolean;
};

function formatPublishedDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function ReleaseNotesList({ release, isCurrent }: Props) {
  return (
    <article className="release-card">
      <header className="release-card__header">
        <div>
          <h3 className="release-card__title">{release.title}</h3>
          <p className="release-card__meta">
            Версия {release.version} · {formatPublishedDate(release.publishedAt)}
          </p>
        </div>
        {isCurrent ? <span className="release-card__badge">Текущая</span> : null}
      </header>
      <ul className="release-card__list">
        {release.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}
