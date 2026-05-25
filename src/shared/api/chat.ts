import { apiRequest } from '@/shared/api/client';
import type {
  ChatContact,
  ChatMessage,
  ChatRoomDetail,
  ChatRoomListItem,
} from '@/shared/api/types';

export function getChatWsUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  if (explicit) return explicit;

  const api = import.meta.env.VITE_API_URL ?? '/api';

  // В dev API на :3000, REST идёт через Vite proxy; WS надёжнее напрямую на API
  if (import.meta.env.DEV && !api.startsWith('http')) {
    return 'ws://127.0.0.1:3000/api/ws/chat';
  }

  if (api.startsWith('http')) {
    const u = new URL(api);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    u.pathname = '/api/ws/chat';
    u.search = '';
    return u.toString();
  }

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/api/ws/chat`;
}

export function listChatContacts() {
  return apiRequest<{ contacts: ChatContact[] }>('/chat/contacts');
}

export function listChatRooms() {
  return apiRequest<{ rooms: ChatRoomListItem[] }>('/chat/rooms');
}

export function fetchChatUnreadCount() {
  return apiRequest<{ count: number }>('/chat/unread-count');
}

export function createDirectChat(userId: string) {
  return apiRequest<{ room: ChatRoomDetail }>('/chat/rooms/direct', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export function createGroupChat(title: string, memberIds: string[]) {
  return apiRequest<{ room: ChatRoomDetail }>('/chat/rooms/group', {
    method: 'POST',
    body: JSON.stringify({ title, memberIds }),
  });
}

export function getChatRoom(roomId: string) {
  return apiRequest<{ room: ChatRoomDetail }>(`/chat/rooms/${roomId}`);
}

export function getChatMessages(roomId: string, before?: string, limit = 50) {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  if (limit !== 50) params.set('limit', String(limit));
  const q = params.toString();
  return apiRequest<{ messages: ChatMessage[]; nextBefore: string | null }>(
    `/chat/rooms/${roomId}/messages${q ? `?${q}` : ''}`,
  );
}

export function postChatMessage(roomId: string, body: string) {
  return apiRequest<{ message: ChatMessage }>(`/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function markChatRoomRead(roomId: string) {
  return apiRequest<{ ok: boolean }>(`/chat/rooms/${roomId}/read`, {
    method: 'PATCH',
  });
}
