import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { listAdminSupportThreads } from '@/shared/api/support';
import type { SupportThreadSummary } from '@/shared/api/types';
import { Avatar } from '@/shared/ui/Avatar';

type Tab = 'open' | 'closed';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function AdminThreadCard({ thread }: { thread: SupportThreadSummary }) {
  return (
    <Link to={`/admin/support/${thread.id}`} className="support-page__card">
      <div className="support-page__card-head support-page__card-head--admin">
        <Avatar
          fullName={thread.author.fullName}
          avatarUrl={thread.author.avatarUrl}
          size="sm"
        />
        <div className="support-page__card-meta">
          <p className="support-page__author-name">{thread.author.fullName}</p>
          <time dateTime={thread.updatedAt}>{formatDate(thread.updatedAt)}</time>
        </div>
        <span
          className={`support-page__status support-page__status--${thread.status}`}
        >
          {thread.status === 'open' ? 'Открыто' : 'Закрыто'}
        </span>
      </div>
      <p className="support-page__preview">
        {thread.lastMessagePreview ?? 'Без сообщений'}
      </p>
    </Link>
  );
}

export function AdminSupportPage() {
  const [tab, setTab] = useState<Tab>('open');

  const listQuery = useQuery({
    queryKey: ['admin', 'support', 'list', tab],
    queryFn: () => listAdminSupportThreads(tab),
  });

  const threads = listQuery.data?.threads ?? [];

  return (
    <div className="admin-page support-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Обращения</h1>
      </header>

      <div className="admin-page__tabs">
        <button
          type="button"
          className={`admin-page__tab${tab === 'open' ? ' admin-page__tab--active' : ''}`}
          onClick={() => setTab('open')}
        >
          Открытые
        </button>
        <button
          type="button"
          className={`admin-page__tab${tab === 'closed' ? ' admin-page__tab--active' : ''}`}
          onClick={() => setTab('closed')}
        >
          Закрытые
        </button>
      </div>

      {listQuery.isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {listQuery.error ? (
        <p className="form-message form-message--error">{(listQuery.error as Error).message}</p>
      ) : null}

      {!listQuery.isLoading && !listQuery.error && threads.length === 0 ? (
        <p className="admin-page__empty">
          {tab === 'open' ? 'Нет открытых обращений' : 'Нет закрытых обращений'}
        </p>
      ) : null}

      {!listQuery.isLoading && !listQuery.error && threads.length > 0 ? (
        <ul className="support-page__list">
          {threads.map((thread) => (
            <li key={thread.id}>
              <AdminThreadCard thread={thread} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
