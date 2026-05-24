import { apiRequest } from '@/shared/api/client';
import type {
  CreateSupportThreadResponse,
  SupportMessage,
  SupportThreadResponse,
  SupportThreadsResponse,
} from '@/shared/api/types';

export function listMySupportThreads() {
  return apiRequest<SupportThreadsResponse>('/support/threads');
}

export function createSupportThread(body: string) {
  return apiRequest<CreateSupportThreadResponse>('/support/threads', {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function getSupportThread(threadId: string) {
  return apiRequest<SupportThreadResponse>(`/support/threads/${threadId}`);
}

export function postSupportMessage(threadId: string, body: string) {
  return apiRequest<{ message: SupportMessage }>(`/support/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function listAdminSupportThreads(status: 'open' | 'closed' = 'open') {
  return apiRequest<SupportThreadsResponse>(
    `/admin/support/threads?status=${encodeURIComponent(status)}`,
  );
}

export function getAdminSupportThread(threadId: string) {
  return apiRequest<SupportThreadResponse>(`/admin/support/threads/${threadId}`);
}

export function postAdminSupportMessage(threadId: string, body: string) {
  return apiRequest<{ message: SupportMessage }>(`/admin/support/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function closeAdminSupportThread(threadId: string) {
  return apiRequest<{ thread: { id: string; status: string } }>(
    `/admin/support/threads/${threadId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    },
  );
}
