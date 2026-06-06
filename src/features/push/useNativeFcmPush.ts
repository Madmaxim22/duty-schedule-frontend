import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PushNotifications } from '@capacitor/push-notifications';
import { isNativeApp } from '@/shared/capacitor/isNativeApp';
import {
  getFcmPushStatus,
  subscribeFcmPush,
  unsubscribeFcmPush,
} from '@/shared/api/push';
import {
  clearFcmPushLocalState,
  getFcmSubscribedFlag,
  getStoredFcmToken,
  setFcmSubscribedFlag,
  setStoredFcmToken,
} from './fcmTokenStore';

export type NativePushStatus =
  | 'loading'
  | 'unsupported'
  | 'server_disabled'
  | 'idle'
  | 'subscribed'
  | 'denied'
  | 'error';

async function syncFcmRegistration(token: string): Promise<void> {
  await setStoredFcmToken(token);
  await subscribeFcmPush(token);
  await setFcmSubscribedFlag(true);
}

export function useNativeFcmPush() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<NativePushStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const listenersReady = useRef(false);

  const refresh = useCallback(async () => {
    if (!isNativeApp()) {
      setStatus('unsupported');
      return;
    }

    try {
      const { enabled } = await getFcmPushStatus();
      if (!enabled) {
        setStatus('server_disabled');
        return;
      }
    } catch {
      setStatus('server_disabled');
      return;
    }

    const perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'denied') {
      setStatus('denied');
      return;
    }

    const [stored, subscribed] = await Promise.all([
      getStoredFcmToken(),
      getFcmSubscribedFlag(),
    ]);

    if (stored || subscribed) {
      setStatus('subscribed');
      if (perm.receive === 'granted') {
        try {
          await PushNotifications.register();
        } catch {
          /* token listener обновит состояние при успехе */
        }
      }
      return;
    }

    if (perm.receive === 'granted') {
      try {
        await PushNotifications.register();
      } catch {
        setStatus('idle');
      }
      return;
    }

    setStatus('idle');
  }, []);

  useEffect(() => {
    if (!isNativeApp() || listenersReady.current) return;

    listenersReady.current = true;

    const registrations: Array<Promise<{ remove: () => void }>> = [];

    registrations.push(
      PushNotifications.addListener('registration', (event) => {
        const token = event.value;
        void syncFcmRegistration(token)
          .then(() => setStatus('subscribed'))
          .catch((err) => {
            setErrorMessage(
              err instanceof Error ? err.message : 'Не удалось сохранить подписку на сервере',
            );
            setStatus('error');
          });
      }),
    );

    registrations.push(
      PushNotifications.addListener('registrationError', (event) => {
        setErrorMessage(event.error ?? 'Ошибка регистрации FCM');
        setStatus('error');
      }),
    );

    registrations.push(
      PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
        const url = event.notification.data?.url;
        if (typeof url === 'string' && url.startsWith('/')) {
          navigate(url);
        } else {
          navigate('/notifications');
        }
      }),
    );

    void refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void Promise.all(registrations).then((handles) => {
        handles.forEach((h) => h.remove());
      });
      listenersReady.current = false;
    };
  }, [navigate, refresh]);

  const enable = useCallback(async () => {
    if (!isNativeApp()) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const { enabled } = await getFcmPushStatus();
      if (!enabled) {
        setStatus('server_disabled');
        return;
      }

      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
        perm = await PushNotifications.requestPermissions();
      }

      if (perm.receive === 'denied') {
        setStatus('denied');
        return;
      }

      if (perm.receive !== 'granted') {
        setStatus('idle');
        return;
      }

      await PushNotifications.register();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Не удалось включить уведомления');
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    if (!isNativeApp()) return;

    setBusy(true);
    setErrorMessage(null);

    try {
      const token = await getStoredFcmToken();
      if (token) {
        await unsubscribeFcmPush(token);
      }
      await clearFcmPushLocalState();
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
    errorMessage,
    busy,
    enable,
    disable,
    refresh,
  };
}
