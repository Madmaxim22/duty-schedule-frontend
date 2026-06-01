import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToDutySwap } from '@/shared/api/duty-swaps';
import type { DutySwapCardPayload } from '@/shared/api/types';
import {
  DUTY_SWAP_STATUS_LABELS,
  formatDutySwapSlot,
} from '@/shared/lib/formatDutySwap';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';

type Props = {
  payload: DutySwapCardPayload;
  currentUserId?: string;
  compact?: boolean;
};

export function ChatDutySwapCard({ payload, currentUserId, compact }: Props) {
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isCounterparty = currentUserId === payload.counterparty.id;
  const canRespond = isCounterparty && payload.status === 'pending_counterparty';

  const respondMutation = useMutation({
    mutationFn: (action: 'accept' | 'reject') =>
      respondToDutySwap(payload.swapRequestId, {
        action,
        rejectReason: action === 'reject' ? rejectReason : undefined,
      }),
    onSuccess: () => {
      setRejectOpen(false);
      setRejectReason('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['duty-swaps'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className={`chat-duty-swap-card${compact ? ' chat-duty-swap-card--compact' : ''}`}>
      <p className="chat-duty-swap-card__title">Смена дежурств</p>
      <p className="chat-duty-swap-card__status">{DUTY_SWAP_STATUS_LABELS[payload.status]}</p>

      <div className="chat-duty-swap-card__slots">
        <div className="chat-duty-swap-card__slot">
          <span className="chat-duty-swap-card__slot-label">
            {formatSurnameWithInitials(payload.requester.fullName)}
          </span>
          <span>{formatDutySwapSlot(payload.requesterSlot)}</span>
        </div>
        <div className="chat-duty-swap-card__swap-icon" aria-hidden>
          ↔
        </div>
        <div className="chat-duty-swap-card__slot">
          <span className="chat-duty-swap-card__slot-label">
            {formatSurnameWithInitials(payload.counterparty.fullName)}
          </span>
          <span>{formatDutySwapSlot(payload.counterpartySlot)}</span>
        </div>
      </div>

      <p className="chat-duty-swap-card__reason">
        <strong>Причина:</strong> {payload.reason}
      </p>

      {payload.counterpartyRejectReason ? (
        <p className="chat-duty-swap-card__note">
          <strong>Отказ:</strong> {payload.counterpartyRejectReason}
        </p>
      ) : null}

      {payload.adminComment ? (
        <p className="chat-duty-swap-card__note">
          <strong>Комментарий администратора:</strong> {payload.adminComment}
        </p>
      ) : null}

      {error ? <p className="form-message form-message--error">{error}</p> : null}

      {canRespond ? (
        <div className="chat-duty-swap-card__actions">
          <Button
            variant="primary"
            disabled={respondMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              respondMutation.mutate('accept');
            }}
          >
            Принять
          </Button>
          <Button
            variant="secondary"
            disabled={respondMutation.isPending}
            onClick={(e) => {
              e.stopPropagation();
              setRejectOpen(true);
            }}
          >
            Отклонить
          </Button>
        </div>
      ) : null}

      <Modal open={rejectOpen} title="Отклонить заявку" onClose={() => setRejectOpen(false)}>
        <label className="duty-swap-modal__label" htmlFor="rejectReason">
          Причина отказа (необязательно)
        </label>
        <textarea
          id="rejectReason"
          className="duty-swap-modal__textarea"
          rows={3}
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
    </div>
  );
}
