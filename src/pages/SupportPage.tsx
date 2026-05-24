import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { createSupportThread, listMySupportThreads } from '@/shared/api/support';
import type { SupportThreadSummary } from '@/shared/api/types';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

const createSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Введите текст обращения')
    .max(2000, 'Не более 2000 символов'),
});

type CreateFormData = z.infer<typeof createSchema>;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ThreadCard({ thread }: { thread: SupportThreadSummary }) {
  return (
    <Link to={`/support/${thread.id}`} className="support-page__card">
      <div className="support-page__card-head">
        <span
          className={`support-page__status support-page__status--${thread.status}`}
        >
          {thread.status === 'open' ? 'Открыто' : 'Закрыто'}
        </span>
        <time dateTime={thread.updatedAt}>{formatDate(thread.updatedAt)}</time>
      </div>
      <p className="support-page__preview">
        {thread.lastMessagePreview ?? 'Без сообщений'}
      </p>
    </Link>
  );
}

export function SupportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = useQuery({
    queryKey: ['support', 'threads'],
    queryFn: listMySupportThreads,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (body: string) => createSupportThread(body),
    onSuccess: (data) => {
      setCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['support', 'threads'] });
      navigate(`/support/${data.thread.id}`);
    },
  });

  const onCreate = handleSubmit((data) => {
    createMutation.mutate(data.body);
  });

  const threads = listQuery.data?.threads ?? [];

  return (
    <div className="support-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Обращения</h1>
      </header>

      <div className="support-page__toolbar">
        <Button onClick={() => setCreateOpen(true)}>Новое обращение</Button>
      </div>

      {listQuery.isLoading ? <p className="page-loading">Загрузка…</p> : null}
      {listQuery.error ? (
        <p className="form-message form-message--error">{(listQuery.error as Error).message}</p>
      ) : null}

      {!listQuery.isLoading && !listQuery.error && threads.length === 0 ? (
        <p className="support-page__empty">
          Пока нет обращений. Нажмите «Новое обращение», чтобы написать администратору.
        </p>
      ) : null}

      {!listQuery.isLoading && !listQuery.error && threads.length > 0 ? (
        <ul className="support-page__list">
          {threads.map((thread) => (
            <li key={thread.id}>
              <ThreadCard thread={thread} />
            </li>
          ))}
        </ul>
      ) : null}

      <Modal
        open={createOpen}
        onClose={() => {
          if (!isSubmitting && !createMutation.isPending) setCreateOpen(false);
        }}
        title="Новое обращение"
      >
        <form className="support-page__create-form" onSubmit={onCreate}>
          <label className="support-page__label" htmlFor="support-create-body">
            Сообщение администратору
          </label>
          <textarea
            id="support-create-body"
            className="support-page__textarea"
            rows={5}
            maxLength={2000}
            disabled={isSubmitting || createMutation.isPending}
            {...register('body')}
          />
          {errors.body ? (
            <p className="form-message form-message--error">{errors.body.message}</p>
          ) : null}
          {createMutation.error ? (
            <p className="form-message form-message--error">
              {(createMutation.error as Error).message}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending ? 'Отправка…' : 'Отправить'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
