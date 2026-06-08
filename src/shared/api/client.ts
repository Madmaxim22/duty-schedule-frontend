import { resolveApiErrorMessage } from '@/shared/api/errors';
import type {
  PhotoLikeStatus,
  UpdatePhotoFocusResponse,
  UploadPhotoResponse,
  User,
  UserPhotosResponse,
} from '@/shared/api/types';

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

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

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
    const payload = data as Record<string, unknown>;
    throw new ApiError(resolveApiErrorMessage(response.status, payload), response.status, payload);
  }

  return data as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetchWithAuth(path, options);
  return parseResponse<T>(response);
}

/** Multipart POST (не ставит Content-Type — boundary выставит браузер). */
export async function apiMultipartRequest<T>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<T> {
  const response = await fetchWithAuth(path, { method, body: formData });
  return parseResponse<T>(response);
}

/** Multipart POST с прогрессом загрузки (для крупных видео). */
export async function apiMultipartRequestWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress?: (ratio: number) => void,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, `${API_BASE}${path}`);
    xhr.withCredentials = true;
    const token = getAccessToken();
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = xhr.responseText ? (JSON.parse(xhr.responseText) as Record<string, unknown>) : {};
      } catch {
        reject(new ApiError(resolveApiErrorMessage(xhr.status), xhr.status));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as T);
        return;
      }

      reject(new ApiError(resolveApiErrorMessage(xhr.status, data), xhr.status, data));
    };

    xhr.onerror = () => reject(new ApiError(resolveApiErrorMessage(0), 0));
    xhr.send(formData);
  });
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
  const data = await uploadPhoto(file, true);
  return data.user;
}

export async function deleteAvatar(): Promise<User> {
  const data = await apiRequest<{ user: User }>('/auth/me/avatar', { method: 'DELETE' });
  return data.user;
}

export function listMyPhotos(): Promise<UserPhotosResponse> {
  return apiRequest<UserPhotosResponse>('/users/me/photos');
}

export function listUserPhotos(userId: string): Promise<UserPhotosResponse> {
  return apiRequest<UserPhotosResponse>(`/users/${userId}/photos`);
}

export async function uploadPhoto(file: File, setAsCurrent = true): Promise<UploadPhotoResponse> {
  const form = new FormData();
  form.append('photo', file);
  const q = setAsCurrent ? '' : '?setAsCurrent=false';
  const response = await fetchWithAuth(`/users/me/photos${q}`, { method: 'POST', body: form });
  return parseResponse<UploadPhotoResponse>(response);
}

export function deletePhoto(photoId: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>(`/users/me/photos/${photoId}`, { method: 'DELETE' });
}

export function setCurrentPhoto(photoId: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>(`/users/me/photos/${photoId}/set-current`, {
    method: 'POST',
  });
}

export function updatePhotoFocus(
  photoId: string,
  focusX: number,
  focusY: number,
): Promise<UpdatePhotoFocusResponse> {
  return apiRequest<UpdatePhotoFocusResponse>(`/users/me/photos/${photoId}/focus`, {
    method: 'PATCH',
    body: JSON.stringify({ focusX, focusY }),
  });
}

export function getPhotoLikeStatus(photoId: string): Promise<PhotoLikeStatus> {
  return apiRequest<PhotoLikeStatus>(`/photos/${photoId}/likes`);
}

export function likePhoto(photoId: string): Promise<PhotoLikeStatus> {
  return apiRequest<PhotoLikeStatus>(`/photos/${photoId}/likes`, { method: 'POST' });
}

export function unlikePhoto(photoId: string): Promise<PhotoLikeStatus> {
  return apiRequest<PhotoLikeStatus>(`/photos/${photoId}/likes`, { method: 'DELETE' });
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
