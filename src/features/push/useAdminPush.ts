import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  getPushVapidPublicKey,
  subscribePush,
  unsubscribePush,
} from '@/shared/api/push';
import { serializePushSubscription, urlBase64ToUint8Array } from './pushSubscription';

export type AdminPushStatus =
  | 'loading'
  | 'unsupported'
  | 'server_disabled'
  | 'idle'
  | 'subscribed'
  | 'denied'
  | 'error';

/** Почему push недоступен (только при status === 'unsupported'). */
export type AdminPushUnsupportedReason =
  | 'not_admin'
  | 'insecure'
  | 'missing_apis'
  | 'no_push_manager';

function detectUnsupportedReason(): AdminPushUnsupportedReason | null {
  if (typeof window === 'undefined') {
    return 'missing_apis';
  }
  if (!window.isSecureContext) {
    return 'insecure';
  }
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return 'missing_apis';
  }
  return null;
}

export function useAdminPush() {
  const { user } = useAuth();
  const [status, setStatus] = useState<AdminPushStatus>('loading');
  const [unsupportedReason, setUnsupportedReason] = useState<AdminPushUnsupportedReason | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === 'admin';

  const refresh = useCallback(async () => {
    if (!isAdmin) {
      setUnsupportedReason('not_admin');
      setStatus('unsupported');
      return;
    }

    const unsupported = detectUnsupportedReason();
    if (unsupported) {
      setUnsupportedReason(unsupported);
      setStatus('unsupported');
      return;
    }

    setUnsupportedReason(null);

    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }

    try {
      await getPushVapidPublicKey();
    } catch {
      setStatus('server_disabled');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) {
      setUnsupportedReason('no_push_manager');
      setStatus('unsupported');
      return;
    }

    const existing = await registration.pushManager.getSubscription();
    setStatus(existing ? 'subscribed' : 'idle');
  }, [isAdmin]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!isAdmin || detectUnsupportedReason()) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const { publicKey } = await getPushVapidPublicKey();
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'idle');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
      }

      await subscribePush(serializePushSubscription(subscription));
      setStatus('subscribed');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Не удалось включить уведомления');
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }, [isAdmin]);

  const disable = useCallback(async () => {
    if (!isAdmin || detectUnsupportedReason()) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const payload = serializePushSubscription(subscription);
        await unsubscribePush(payload.endpoint);
        await subscription.unsubscribe();
      }
      setStatus('idle');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Не удалось отключить уведомления');
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }, [isAdmin]);

  return {
    status,
    unsupportedReason,
    errorMessage,
    busy,
    enable,
    disable,
    refresh,
    isAdmin,
  };
}
