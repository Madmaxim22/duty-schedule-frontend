import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import arrowLeftIcon from '@/shared/assets/icons/Arrow Left.svg';
import {
  cancelDutySwap,
  listMyDutySwaps,
  respondToDutySwap,
} from '@/shared/api/duty-swaps';
import type { DutySwapRequest } from '@/shared/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import {
  DUTY_SWAP_STATUS_LABELS,
  dutySwapStatusClass,
  formatDutySwapSlot,
} from '@/shared/lib/formatDutySwap';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type Tab = 'incoming' | 'outgoing';

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function SwapCard({
  request,
  currentUserId,
  onChanged,
}: {
  request: DutySwapRequest;
  currentUserId: string;
  onChanged: () => void;
}) {
  const navigate = useNavigate();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const isIncoming = request.counterparty.id === currentUserId;
  const isOutgoing = request.requester.id === currentUserId;

  const respondMutation = useMutation({
    mutationFn: (action: 'accept' | 'reject') =>
      respondToDutySwap(request.id, {
        action,
        rejectReason: action === 'reject' ? rejectReason : undefined,
      }),
    onSuccess: onChanged,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelDutySwap(request.id),
    onSuccess: onChanged,
  });

  const canRespond = isIncoming && request.status === 'pending_counterparty';
  const canCancel =
    isOutgoing &&
    (request.status === 'pending_counterparty' || request.status === 'pending_admin');

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

      {request.adminComment ? (
        <p className="duty-swaps-page__note">
          <strong>Администратор:</strong> {request.adminComment}
        </p>
      ) : null}

      <div className="duty-swaps-page__card-actions">
        {request.chatRoomId ? (
          <Button variant="secondary" onClick={() => navigate(`/chat/${request.chatRoomId}`)}>
            Чат
          </Button>
        ) : null}
        {canRespond ? (
          <>
            <Button
              variant="primary"
              disabled={respondMutation.isPending}
              onClick={() => respondMutation.mutate('accept')}
            >
              Принять
            </Button>
            <Button variant="secondary" onClick={() => setRejectOpen(true)}>
              Отклонить
            </Button>
          </>
        ) : null}
        {canCancel ? (
          <Button
            variant="secondary"
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            Отменить
          </Button>
        ) : null}
      </div>

      <Modal open={rejectOpen} title="Отклонить заявку" onClose={() => setRejectOpen(false)}>
        <textarea
          className="duty-swap-modal__textarea"
          rows={3}
          placeholder="Причина отказа (необязательно)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="duty-swap-modal__actions">
          <Button variant="secondary" onClick={() => setRejectOpen(false)}>
            Отмена
          </Button>
          <Button
            variant="primary"
            disabled={respondMutation.isPending}
            onClick={() => respondMutation.mutate('reject')}
          >
            Отклонить
          </Button>
        </div>
      </Modal>
    </article>
  );
}

export function DutySwapsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('incoming');

  const listQuery = useQuery({
    queryKey: ['duty-swaps', 'mine', tab],
    queryFn: () => listMyDutySwaps({ role: tab }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['duty-swaps'] });
  };

  const requests = listQuery.data?.requests ?? [];

  return (
    <div className="duty-swaps-page">
      <header className="subpage-header">
        <Link to="/" className="subpage-header__back" aria-label="Назад к календарю">
          <img src={arrowLeftIcon} alt="" width={24} height={24} aria-hidden />
        </Link>
        <h1 className="subpage-header__title">Смена дежурств</h1>
      </header>

      <div className="duty-swaps-page__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`duty-swaps-page__tab${tab === 'incoming' ? ' duty-swaps-page__tab--active' : ''}`}
          aria-selected={tab === 'incoming'}
          onClick={() => setTab('incoming')}
        >
          Входящие
        </button>
        <button
          type="button"
          role="tab"
          className={`duty-swaps-page__tab${tab === 'outgoing' ? ' duty-swaps-page__tab--active' : ''}`}
          aria-selected={tab === 'outgoing'}
          onClick={() => setTab('outgoing')}
        >
          Исходящие
        </button>
      </div>

      {listQuery.isLoading ? <p className="form-message">Загрузка…</p> : null}
      {listQuery.error ? (
        <p className="form-message form-message--error">{(listQuery.error as Error).message}</p>
      ) : null}

      {requests.length === 0 && !listQuery.isLoading ? (
        <p className="duty-swaps-page__empty">Заявок пока нет</p>
      ) : (
        <div className="duty-swaps-page__list">
          {requests.map((request) => (
            <SwapCard
              key={request.id}
              request={request}
              currentUserId={user!.id}
              onChanged={invalidate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
