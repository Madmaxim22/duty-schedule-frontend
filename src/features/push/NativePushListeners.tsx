import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PushNotifications } from '@capacitor/push-notifications';
import { useAuth } from '@/features/auth/AuthContext';
import { isNativeApp } from '@/shared/capacitor/isNativeApp';

function resolvePushUrl(data: Record<string, unknown> | undefined): string | null {
  const url = data?.url;
  if (typeof url === 'string' && url.startsWith('/')) {
    return url;
  }
  return null;
}

/** Глобальные слушатели FCM: тап по push → deep link (например /chat/:roomId). */
export function NativePushListeners() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const pendingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && pendingUrlRef.current) {
      const url = pendingUrlRef.current;
      pendingUrlRef.current = null;
      navigate(url);
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!isNativeApp()) return;

    let removed = false;
    let removeListener: (() => void) | undefined;

    void PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
      const url = resolvePushUrl(event.notification.data) ?? '/notifications';

      if (isLoading) {
        pendingUrlRef.current = url;
        return;
      }

      if (!user) {
        navigate('/login', { state: { from: url } });
        return;
      }

      navigate(url);
    }).then((handle) => {
      if (removed) {
        handle.remove();
      } else {
        removeListener = () => handle.remove();
      }
    });

    return () => {
      removed = true;
      removeListener?.();
    };
  }, [isLoading, navigate, user]);

  return null;
}
