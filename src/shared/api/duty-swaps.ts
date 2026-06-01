import { apiRequest } from '@/shared/api/client';
import type { DutySwapRequest, DutySwapStatus } from '@/shared/api/types';

export function createDutySwap(body: {
  requesterSlot: { date: string; section: 'A' | 'B'; office: string };
  counterpartySlot: { date: string; section: 'A' | 'B'; office: string };
  reason: string;
}) {
  return apiRequest<{ request: DutySwapRequest; chatRoomId: string }>('/duty-swaps', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listMyDutySwaps(params?: {
  role?: 'outgoing' | 'incoming' | 'all';
  status?: DutySwapStatus;
}) {
  const q = new URLSearchParams();
  if (params?.role) q.set('role', params.role);
  if (params?.status) q.set('status', params.status);
  const query = q.toString();
  return apiRequest<{ requests: DutySwapRequest[] }>(
    `/duty-swaps/mine${query ? `?${query}` : ''}`,
  );
}

export function getDutySwap(id: string) {
  return apiRequest<{ request: DutySwapRequest }>(`/duty-swaps/${id}`);
}

export function respondToDutySwap(
  id: string,
  body: { action: 'accept' | 'reject'; rejectReason?: string },
) {
  return apiRequest<{ request: DutySwapRequest }>(`/duty-swaps/${id}/respond`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function cancelDutySwap(id: string) {
  return apiRequest<{ request: DutySwapRequest }>(`/duty-swaps/${id}`, {
    method: 'DELETE',
  });
}

export function listAdminDutySwaps(params?: {
  status?: DutySwapStatus | 'all';
  limit?: number;
  cursor?: string;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.cursor) q.set('cursor', params.cursor);
  const query = q.toString();
  return apiRequest<{ requests: DutySwapRequest[]; nextCursor: string | null }>(
    `/admin/duty-swaps${query ? `?${query}` : ''}`,
  );
}

export function adminReviewDutySwap(
  id: string,
  body: { action: 'approve' | 'reject'; adminComment: string },
) {
  return apiRequest<{ request: DutySwapRequest }>(`/admin/duty-swaps/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
