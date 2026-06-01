import { formatDutyDate } from '@/shared/lib/formatDutyChange';
import type { DutySwapSlot, DutySwapStatus } from '@/shared/api/types';

export function formatDutySwapSlot(slot: DutySwapSlot): string {
  return `каб. ${slot.office}, ${formatDutyDate(slot.date)}`;
}

export const DUTY_SWAP_STATUS_LABELS: Record<DutySwapStatus, string> = {
  pending_counterparty: 'Ожидает согласия',
  rejected_counterparty: 'Отклонено участником',
  pending_admin: 'Ожидает администратора',
  approved: 'Одобрено',
  rejected_admin: 'Отклонено администратором',
  cancelled: 'Отменено',
};

export function dutySwapStatusClass(status: DutySwapStatus): string {
  return `duty-swap-status--${status}`;
}
