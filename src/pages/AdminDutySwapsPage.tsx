import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminReviewDutySwap, listAdminDutySwaps } from '@/shared/api/duty-swaps';
import type { DutySwapRequest } from '@/shared/api/types';
import {
  DUTY_SWAP_STATUS_LABELS,
  dutySwapStatusClass,
  formatDutySwapSlot,
} from '@/shared/lib/formatDutySwap';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { SubpageLayout } from '@/shared/ui/SubpageLayout';

type Tab = 'pending' | 'history';

const reviewSchema = z.object({
  adminComment: z.string().trim().min(1, 'Укажите комментарий').max(1000),
});

type ReviewForm = z.infer<typeof reviewSchema>;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ADMIN_APPROVE_COMMENT = 'Одобрено';

function AdminSwapCard({
  request,
  onApprove,
  onReject,
  isReviewPending,
}: {
  request: DutySwapRequest;
  onApprove: (request: DutySwapRequest) => void;
  onReject: (request: DutySwapRequest) => void;
  isReviewPending: boolean;
}) {
  return (
    <article className="duty-swaps-page__card">
      <div className="duty-swaps-page__card-head">
        <span className={`duty-swaps-page__status ${dutySwapStatusClass(request.status)}`}>
          {DUTY_SWAP_STATUS_LABELS[request.status]}
        </span>
        <time dateTime={request.createdAt}>{formatDateTime(request.createdAt)}</time>
      </div>

      <p className="duty-swaps-page__participants">
        {formatSurnameWithInitials(request.requester.fullName)} ↔{' '}
        {formatSurnameWithInitials(request.counterparty.fullName)}
      </p>

      <ul className="duty-swaps-page__slots">
        <li>{formatDutySwapSlot(request.requesterSlot)}</li>
        <li>{formatDutySwapSlot(request.counterpartySlot)}</li>
      </ul>

      <p className="duty-swaps-page__reason">
        <strong>Причина:</strong> {request.reason}
      </p>

      {request.counterpartyRespondedAt ? (
        <p className="duty-swaps-page__note">
          Согласовано участниками: {formatDateTime(request.counterpartyRespondedAt)}
        </p>
      ) : null}

      {request.status === 'pending_admin' ? (
        <div className="duty-swaps-page__card-actions">
          <Button
            variant="primary"
            disabled={isReviewPending}
            onClick={() => onApprove(request)}
          >
            Одобрить
          </Button>
          <Button variant="secondary" disabled={isReviewPending} onClick={() => onReject(request)}>
            Отклонить
          </Button>
        </div>
      ) : null}

      {request.adminComment ? (
        <p className="duty-swaps-page__note">
          <strong>Комментарий:</strong> {request.adminComment}
        </p>
      ) : null}
    </article>
  );
}

export function AdminDutySwapsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('pending');
  const [rejectTarget, setRejectTarget] = useState<DutySwapRequest | null>(null);

  const status = tab === 'pending' ? 'pending_admin' : 'all';

  const listQuery = useQuery({
    queryKey: ['duty-swaps', 'admin', tab],
    queryFn: () =>
      listAdminDutySwaps({
        status,
        limit: 50,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewForm>({ resolver: zodResolver(reviewSchema) });

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      action,
      adminComment,
    }: {
      id: string;
      action: 'approve' | 'reject';
      adminComment: string;
    }) => adminReviewDutySwap(id, { action, adminComment }),
    onSuccess: () => {
      setRejectTarget(null);
      reset({ adminComment: '' });
      queryClient.invalidateQueries({ queryKey: ['duty-swaps'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });

  const requests =
    tab === 'history'
      ? (listQuery.data?.requests ?? []).filter(
          (r) =>
            r.status === 'approved' ||
            r.status === 'rejected_admin' ||
            r.status === 'rejected_counterparty' ||
            r.status === 'cancelled',
        )
      : (listQuery.data?.requests ?? []);

  const approveRequest = (request: DutySwapRequest) => {
    reviewMutation.mutate({
      id: request.id,
      action: 'approve',
      adminComment: ADMIN_APPROVE_COMMENT,
    });
  };

  const openReject = (request: DutySwapRequest) => {
    setRejectTarget(request);
    reset({ adminComment: '' });
  };

  const onRejectSubmit = handleSubmit((data) => {
    if (!rejectTarget) return;
    reviewMutation.mutate({
      id: rejectTarget.id,
      action: 'reject',
      adminComment: data.adminComment,
    });
  });

  return (
    <SubpageLayout className="duty-swaps-page" title="Заявки на смену">
      <div className="duty-swaps-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`duty-swaps-page__tab${tab === 'pending' ? ' duty-swaps-page__tab--active' : ''}`}
          aria-selected={tab === 'pending'}
          onClick={() => setTab('pending')}
        >
          Ожидают решения
        </button>
        <button
          type="button"
          role="tab"
          className={`duty-swaps-page__tab${tab === 'history' ? ' duty-swaps-page__tab--active' : ''}`}
          aria-selected={tab === 'history'}
          onClick={() => setTab('history')}
        >
          История
        </button>
      </div>

      {listQuery.isLoading ? <p className="form-message">Загрузка…</p> : null}

      {requests.length === 0 && !listQuery.isLoading ? (
        <p className="duty-swaps-page__empty">Заявок нет</p>
      ) : (
        <div className="duty-swaps-page__list">
          {requests.map((request) => (
            <AdminSwapCard
              key={request.id}
              request={request}
              onApprove={approveRequest}
              onReject={openReject}
              isReviewPending={reviewMutation.isPending}
            />
          ))}
        </div>
      )}

      <Modal open={Boolean(rejectTarget)} title="Отклонить заявку" onClose={() => setRejectTarget(null)}>
        <form onSubmit={onRejectSubmit}>
          <label className="duty-swap-modal__label" htmlFor="adminComment">
            Комментарий администратора
          </label>
          <textarea
            id="adminComment"
            className="duty-swap-modal__textarea"
            rows={4}
            {...register('adminComment')}
          />
          {errors.adminComment ? (
            <p className="form-message form-message--error">{errors.adminComment.message}</p>
          ) : null}
          {reviewMutation.error ? (
            <p className="form-message form-message--error">
              {(reviewMutation.error as Error).message}
            </p>
          ) : null}
          <div className="duty-swap-modal__actions">
            <Button type="button" variant="secondary" onClick={() => setRejectTarget(null)}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || reviewMutation.isPending}>
              Отклонить
            </Button>
          </div>
        </form>
      </Modal>
    </SubpageLayout>
  );
}
