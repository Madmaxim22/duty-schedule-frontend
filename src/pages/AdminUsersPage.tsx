import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import { apiRequest } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';

type PendingUser = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export function AdminUsersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'pending'],
    queryFn: () => apiRequest<{ users: PendingUser[] }>('/admin/users/pending'),
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiRequest(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] });
    },
  });

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <Link to="/" className="admin-page__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="admin-page__title">Модерация регистраций</h1>
      </header>

      {isLoading ? <p>Загрузка…</p> : null}
      {error ? <p className="form-message form-message--error">{(error as Error).message}</p> : null}

      {!isLoading && (data?.users.length ?? 0) === 0 ? (
        <p className="admin-page__empty">Нет заявок на подтверждение</p>
      ) : null}

      <ul className="admin-page__list">
        {data?.users.map((u) => (
          <li key={u.id} className="admin-page__card">
            <div>
              <strong>{u.fullName}</strong>
              <p className="admin-page__email">{u.email}</p>
            </div>
            <div className="admin-page__card-actions">
              <Button
                variant="primary"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ id: u.id, action: 'approve' })}
              >
                Одобрить
              </Button>
              <Button
                variant="danger"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate({ id: u.id, action: 'reject' })}
              >
                Отклонить
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
