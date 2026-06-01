import { apiRequest } from '@/shared/api/client';
import type { BrowserPushSubscription } from '@/features/push/pushSubscription';

export function getPushVapidPublicKey(): Promise<{ publicKey: string }> {
  return apiRequest<{ publicKey: string }>('/push/vapid-public-key', { skipAuth: true });
}

export function subscribePush(subscription: BrowserPushSubscription): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/push/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
}

export function unsubscribePush(endpoint: string): Promise<void> {
  return apiRequest<void>('/push/subscribe', {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });
}

export function getFcmPushStatus(): Promise<{ enabled: boolean }> {
  return apiRequest<{ enabled: boolean }>('/push/fcm-status', { skipAuth: true });
}

export function subscribeFcmPush(token: string, platform: 'android' | 'ios' = 'android') {
  return apiRequest<{ message: string }>('/push/fcm-subscribe', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });
}

export function unsubscribeFcmPush(token: string): Promise<void> {
  return apiRequest<void>('/push/fcm-subscribe', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}
