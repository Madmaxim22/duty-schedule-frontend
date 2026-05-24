import { apiRequest } from './client';
import type { NotificationsResponse } from './types';

export function fetchNotifications(limit: number, cursor?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  return apiRequest<NotificationsResponse>(`/notifications?${params}`);
}

export function fetchUnreadNotificationsCount() {
  return apiRequest<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(id: string) {
  return apiRequest<void>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return apiRequest<void>('/notifications/read-all', { method: 'PATCH' });
}
