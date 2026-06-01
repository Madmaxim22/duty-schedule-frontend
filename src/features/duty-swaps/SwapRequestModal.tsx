import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/shared/api/client';
import { createDutySwap } from '@/shared/api/duty-swaps';
import type { MonthSchedule } from '@/shared/api/types';
import { useAuth } from '@/features/auth/AuthContext';
import {
  collectMyUpcomingDutySlots,
  getSwapSlotWindow,
  SWAP_SLOT_WINDOW_DAYS,
  slotKey,
} from '@/features/duty-swaps/collectMyUpcomingDutySlots';
import { formatDutySwapSlot } from '@/shared/lib/formatDutySwap';
import { formatSurnameWithInitials } from '@/shared/lib/formatName';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Минимум 3 символа')
    .max(1000, 'Не более 1000 символов'),
});

type ReasonForm = z.infer<typeof reasonSchema>;

export type SwapSlotPick = {
  date: string;
  section: 'A' | 'B';
  office: string;
  userId?: string;
  fullName?: string;
};

type Props = {
  open: boolean;
  initialCounterpartySlot: SwapSlotPick | null;
  onClose: () => void;
};

export function SwapRequestModal({ open, initialCounterpartySlot, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requesterSlot, setRequesterSlot] = useState<SwapSlotPick | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdChatRoomId, setCreatedChatRoomId] = useState<string | null>(null);

  const counterpartySlot = initialCounterpartySlot;
  const swapWindow = useMemo(() => {
    if (!counterpartySlot?.date) return null;
    return getSwapSlotWindow(counterpartySlot.date);
  }, [counterpartySlot?.date]);
  const monthKeys = swapWindow?.monthKeys ?? [];

  const monthQueries = useQueries({
    queries: monthKeys.map(({ year, month }) => ({
      queryKey: ['schedule', 'month', year, month],
      queryFn: () =>
        apiRequest<MonthSchedule>(`/schedule/month?year=${year}&month=${month}`),
      enabled: open && monthKeys.length > 0,
    })),
  });

  const monthQueriesLoadKey = monthQueries
    .map((q) => `${q.fetchStatus}:${q.dataUpdatedAt}`)
    .join('|');

  const allMonthsLoaded =
    monthKeys.length > 0 &&
    monthQueries.length === monthKeys.length &&
    monthQueries.every((q) => q.isSuccess && Boolean(q.data));

  const monthSchedules = useMemo(
    () =>
      monthQueries
        .map((q) => q.data)
        .filter((data): data is MonthSchedule => Boolean(data)),
    [monthQueriesLoadKey, monthKeys.length],
  );

  const counterpartySlotKey = counterpartySlot ? slotKey(counterpartySlot) : null;

  const mySlots = useMemo(() => {
    if (!user?.id || !swapWindow || !allMonthsLoaded) return [];
    const all = collectMyUpcomingDutySlots(monthSchedules, user.id, {
      anchorDate: swapWindow.anchor,
    });
    if (!counterpartySlotKey) return all;
    return all.filter((s) => slotKey(s) !== counterpartySlotKey);
  }, [
    monthSchedules,
    user?.id,
    swapWindow,
    allMonthsLoaded,
    counterpartySlotKey,
  ]);

  const mySlotsKey = useMemo(() => mySlots.map(slotKey).join('\0'), [mySlots]);

  const isLoadingSlots =
    monthKeys.length > 0 &&
    (!allMonthsLoaded || monthQueries.some((q) => q.isPending || q.isLoading));

  useEffect(() => {
    if (!open) return;
    setRequesterSlot(null);
    setSubmitError(null);
    setCreatedChatRoomId(null);
  }, [open, counterpartySlotKey]);

  useEffect(() => {
    if (!open || isLoadingSlots) return;

    setRequesterSlot((prev) => {
      if (mySlots.length === 0) return null;
      if (mySlots.length === 1) {
        const only = mySlots[0]!;
        return prev && slotKey(prev) === slotKey(only) ? prev : only;
      }
      if (prev && mySlots.some((s) => slotKey(s) === slotKey(prev))) return prev;
      return null;
    });
  }, [open, isLoadingSlots, mySlotsKey]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReasonForm>({ resolver: zodResolver(reasonSchema) });

  useEffect(() => {
    if (open) reset({ reason: '' });
  }, [open, reset]);

  const createMutation = useMutation({
    mutationFn: createDutySwap,
    onSuccess: (data) => {
      setCreatedChatRoomId(data.chatRoomId);
    },
    onError: (err: Error) => {
      setSubmitError(err.message);
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (!requesterSlot || !counterpartySlot) {
      setSubmitError('Выберите своё дежурство');
      return;
    }
    setSubmitError(null);
    createMutation.mutate({
      requesterSlot: {
        date: requesterSlot.date,
        section: requesterSlot.section,
        office: requesterSlot.office,
      },
      counterpartySlot: {
        date: counterpartySlot.date,
        section: counterpartySlot.section,
        office: counterpartySlot.office,
      },
      reason: data.reason,
    });
  });

  if (createdChatRoomId) {
    return (
      <Modal open={open} title="Заявка отправлена" onClose={onClose}>
        <p className="duty-swap-modal__success">
          Заявка отправлена в чат с участником.
        </p>
        <div className="duty-swap-modal__actions">
          <Button variant="secondary" onClick={onClose}>
            Закрыть
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              navigate(`/chat/${createdChatRoomId}`);
            }}
          >
            Открыть чат
          </Button>
        </div>
      </Modal>
    );
  }

  const counterpartyName = counterpartySlot?.fullName
    ? formatSurnameWithInitials(counterpartySlot.fullName)
    : null;

  return (
    <Modal
      open={open}
      title={
        counterpartyName
          ? `Смена с ${counterpartyName}`
          : 'Смена дежурств'
      }
      onClose={onClose}
    >
      <form className="duty-swap-modal" onSubmit={onSubmit}>
        {counterpartySlot ? (
          <div className="duty-swap-modal__field">
            <p className="duty-swap-modal__label">Дежурство коллеги</p>
            <p className="duty-swap-modal__fixed-slot">
              {counterpartyName} — {formatDutySwapSlot(counterpartySlot)}
            </p>
          </div>
        ) : null}

        <div className="duty-swap-modal__field">
          <label className="duty-swap-modal__label" htmlFor="requesterSlot">
            Ваше дежурство
          </label>
          {isLoadingSlots ? (
            <p className="form-message">Загрузка ваших дежурств…</p>
          ) : mySlots.length > 0 ? (
            <select
              id="requesterSlot"
              className="duty-swap-modal__select"
              value={requesterSlot ? slotKey(requesterSlot) : ''}
              onChange={(e) => {
                const picked = mySlots.find((s) => slotKey(s) === e.target.value);
                setRequesterSlot(picked ?? null);
              }}
            >
              {mySlots.length > 1 ? (
                <option value="">Выберите дежурство</option>
              ) : null}
              {mySlots.map((slot) => (
                <option key={slotKey(slot)} value={slotKey(slot)}>
                  {formatDutySwapSlot(slot)}
                </option>
              ))}
            </select>
          ) : (
            <p className="form-message">
              Нет ваших дежурств в пределах {SWAP_SLOT_WINDOW_DAYS} дней от даты
              дежурства коллеги
            </p>
          )}
        </div>

        <div className="duty-swap-modal__field">
          <label className="duty-swap-modal__label" htmlFor="swapReason">
            Причина
          </label>
          <textarea
            id="swapReason"
            className="duty-swap-modal__textarea"
            rows={4}
            {...register('reason')}
          />
          {errors.reason ? (
            <p className="form-message form-message--error">{errors.reason.message}</p>
          ) : null}
        </div>

        {submitError ? (
          <p className="form-message form-message--error">{submitError}</p>
        ) : null}

        <div className="duty-swap-modal__actions">
          <Button type="button" variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={
              isSubmitting ||
              createMutation.isPending ||
              isLoadingSlots ||
              !requesterSlot ||
              !counterpartySlot
            }
          >
            Отправить заявку
          </Button>
        </div>
      </form>
    </Modal>
  );
}
