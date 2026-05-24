import { useCallback, useEffect, useState } from 'react';
import {
  getPushVapidPublicKey,
  subscribePush,
  unsubscribePush,
} from '@/shared/api/push';
import { serializePushSubscription, urlBase64ToUint8Array } from './pushSubscription';

export type PushStatus =
  | 'loading'
  | 'unsupported'
  | 'server_disabled'
  | 'idle'
  | 'subscribed'
  | 'denied'
  | 'error';

export type PushUnsupportedReason = 'insecure' | 'missing_apis' | 'no_push_manager';

function detectUnsupportedReason(): PushUnsupportedReason | null {
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

export function useBrowserPush() {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [unsupportedReason, setUnsupportedReason] = useState<PushUnsupportedReason | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (detectUnsupportedReason()) return;

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
  }, []);

  const disable = useCallback(async () => {
    if (detectUnsupportedReason()) return;

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
  }, []);

  return {
    status,
    unsupportedReason,
    errorMessage,
    busy,
    enable,
    disable,
    refresh,
  };
}
