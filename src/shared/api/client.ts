import type { AvatarLikeStatus, User } from '@/shared/api/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

let accessToken: string | null = localStorage.getItem('accessToken');

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
}

export function getAccessToken() {
  return accessToken;
}

type RequestOptions = RequestInit & { skipAuth?: boolean };

async function fetchWithAuth(path: string, options: RequestOptions = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !options.skipAuth && path !== '/auth/refresh') {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set('Authorization', `Bearer ${accessToken}`);
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return response;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { message?: string }).message ?? 'Ошибка запроса');
  }

  return data as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetchWithAuth(path, options);
  return parseResponse<T>(response);
}

export async function apiUpload<T>(
  path: string,
  fieldName: string,
  file: File,
): Promise<T> {
  const form = new FormData();
  form.append(fieldName, file);
  const response = await fetchWithAuth(path, { method: 'POST', body: form });
  return parseResponse<T>(response);
}

export async function uploadAvatar(file: File): Promise<User> {
  const data = await apiUpload<{ user: User }>('/auth/me/avatar', 'avatar', file);
  return data.user;
}

export async function deleteAvatar(): Promise<User> {
  const data = await apiRequest<{ user: User }>('/auth/me/avatar', { method: 'DELETE' });
  return data.user;
}

export function getAvatarLikeStatus(targetUserId: string): Promise<AvatarLikeStatus> {
  return apiRequest<AvatarLikeStatus>(`/avatar-likes/${targetUserId}`);
}

export function likeAvatar(targetUserId: string): Promise<AvatarLikeStatus> {
  return apiRequest<AvatarLikeStatus>(`/avatar-likes/${targetUserId}`, { method: 'POST' });
}

export function unlikeAvatar(targetUserId: string): Promise<AvatarLikeStatus> {
  return apiRequest<AvatarLikeStatus>(`/avatar-likes/${targetUserId}`, { method: 'DELETE' });
}

async function tryRefresh(): Promise<boolean> {
  try {
    const data = await apiRequest<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}
