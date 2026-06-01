import { isNativeApp } from '@/shared/capacitor/isNativeApp';
import { unsubscribeFcmPush } from '@/shared/api/push';
import { getStoredFcmToken, setStoredFcmToken } from './fcmTokenStore';
/** Снимает Web Push и FCM-подписку текущего устройства (best-effort). */
export async function unsubscribePushOnLogout(): Promise<void> {
  if (isNativeApp()) {
    const token = getStoredFcmToken();
    if (token) {
      try {
        await unsubscribeFcmPush(token);
      } catch {
        /* ignore */
      }
      setStoredFcmToken(null);
    }
    return;
  }

  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('Notification' in window)
  ) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager?.getSubscription();
    if (!subscription) return;

    const { unsubscribePush } = await import('@/shared/api/push');
    await unsubscribePush(subscription.endpoint);
    await subscription.unsubscribe();
  } catch {
    /* ignore */
  }
}
