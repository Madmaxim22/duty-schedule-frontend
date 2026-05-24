import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import deleteIcon from '@/shared/assets/icons/Delete.svg';
import { apiRequest } from '@/shared/api/client';
import type { UserRole, UserStatus } from '@/shared/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type PendingUser = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

type Tab = 'pending' | 'all';

const STATUS_LABELS: Record<UserStatus, string> = {
  pending: 'Ожидает',
  approved: 'Одобрен',
  rejected: 'Отклонён',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  user: 'Пользователь',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU');
}

export function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['admin', 'pending'],
    queryFn: () => apiRequest<{ users: PendingUser[] }>('/admin/users/pending'),
  });

  const allQuery = useQuery({
    queryKey: ['admin', 'all'],
    queryFn: () => apiRequest<{ users: AdminUser[] }>('/admin/users'),
    enabled: tab === 'all',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiRequest(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'approved'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'all'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'approved'] });
    },
  });

  const isLoading = tab === 'pending' ? pendingQuery.isLoading : allQuery.isLoading;
  const error = tab === 'pending' ? pendingQuery.error : allQuery.error;
  const isBusy = statusMutation.isPending || deleteMutation.isPending;

  function confirmDelete() {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete.id);
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <Link to="/" className="admin-page__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="admin-page__title">Пользователи</h1>
      </header>

      <div className="admin-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pending'}
          className={`admin-page__tab${tab === 'pending' ? ' admin-page__tab--active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Заявки
          {(pendingQuery.data?.users.length ?? 0) > 0 ? (
            <span className="admin-page__tab-badge">{pendingQuery.data!.users.length}</span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={`admin-page__tab${tab === 'all' ? ' admin-page__tab--active' : ''}`}
          onClick={() => setTab('all')}
        >
          Все учётные записи
        </button>
      </div>

      {isLoading ? <p>Загрузка…</p> : null}
      {error ? <p className="form-message form-message--error">{(error as Error).message}</p> : null}

      {tab === 'pending' ? (
        <>
          {!isLoading && (pendingQuery.data?.users.length ?? 0) === 0 ? (
            <p className="admin-page__empty">Нет заявок на подтверждение</p>
          ) : null}
          <ul className="admin-page__list">
            {pendingQuery.data?.users.map((u) => (
              <li key={u.id} className="admin-page__card">
                <div>
                  <strong>{u.fullName}</strong>
                  <p className="admin-page__email">{u.email}</p>
                  <p className="admin-page__meta">Зарегистрирован: {formatDate(u.createdAt)}</p>
                </div>
                <div className="admin-page__card-actions">
                  <Button
                    variant="primary"
                    disabled={isBusy}
                    onClick={() => statusMutation.mutate({ id: u.id, action: 'approve' })}
                  >
                    Одобрить
                  </Button>
                  <Button
                    variant="danger"
                    disabled={isBusy}
                    onClick={() => statusMutation.mutate({ id: u.id, action: 'reject' })}
                  >
                    Отклонить
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {!isLoading && (allQuery.data?.users.length ?? 0) === 0 ? (
            <p className="admin-page__empty">Нет пользователей</p>
          ) : null}
          <ul className="admin-page__list">
            {allQuery.data?.users.map((u) => {
              const canDelete = u.role !== 'admin' && u.id !== currentUser?.id;
              return (
                <li
                  key={u.id}
                  className={`admin-page__card${canDelete ? ' admin-page__card--with-delete' : ''}`}
                >
                  <div className="admin-page__card-body">
                    <div className="admin-page__card-head">
                      <strong>{u.fullName}</strong>
                      <span
                        className={`admin-page__status admin-page__status--${u.status}`}
                      >
                        {STATUS_LABELS[u.status]}
                      </span>
                    </div>
                    <p className="admin-page__email">{u.email}</p>
                    <p className="admin-page__meta">
                      {ROLE_LABELS[u.role]} · с {formatDate(u.createdAt)}
                    </p>
                  </div>
                  {canDelete ? (
                    <button
                      type="button"
                      className="admin-page__delete"
                      disabled={isBusy}
                      aria-label={`Удалить ${u.fullName}`}
                      onClick={() => setUserToDelete(u)}
                    >
                      <img src={deleteIcon} alt="" width={24} height={24} aria-hidden />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Modal
        open={userToDelete !== null}
        title="Удалить учётную запись?"
        onClose={() => {
          if (!deleteMutation.isPending) setUserToDelete(null);
        }}
        footer={
          <div className="modal__footer-actions">
            <Button
              variant="secondary"
              disabled={deleteMutation.isPending}
              onClick={() => setUserToDelete(null)}
            >
              Отмена
            </Button>
            <Button variant="danger" disabled={deleteMutation.isPending} onClick={confirmDelete}>
              {deleteMutation.isPending ? 'Удаление…' : 'Удалить'}
            </Button>
          </div>
        }
      >
        {userToDelete ? (
          <p>
            Учётная запись «<strong>{userToDelete.fullName}</strong>» ({userToDelete.email}) будет
            удалена без возможности восстановления.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}
