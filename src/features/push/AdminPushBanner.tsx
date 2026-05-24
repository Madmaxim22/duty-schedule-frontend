import { Button } from '@/shared/ui/Button';
import { getAdminPushUnsupportedMessage } from './adminPushUnsupportedMessage';
import { useAdminPush } from './useAdminPush';

export function AdminPushBanner() {
  const { status, unsupportedReason, errorMessage, busy, enable, disable } = useAdminPush();

  if (status === 'loading') {
    return null;
  }

  if (status === 'unsupported') {
    return (
      <div className="admin-push admin-push--muted" role="status">
        <p className="admin-push__text">{getAdminPushUnsupportedMessage(unsupportedReason)}</p>
      </div>
    );
  }

  if (status === 'server_disabled') {
    return (
      <div className="admin-push admin-push--muted" role="status">
        <p className="admin-push__text">Push на сервере не настроен (VAPID-ключи в .env backend).</p>
      </div>
    );
  }

  return (
    <div className="admin-push" role="region" aria-label="Уведомления о заявках">
      <p className="admin-push__text">
        Получать push при новой регистрации на сайте.
      </p>
      {status === 'denied' ? (
        <p className="admin-push__hint">
          Уведомления заблокированы в настройках браузера — разрешите их для этого сайта.
        </p>
      ) : null}
      {errorMessage ? <p className="form-message form-message--error">{errorMessage}</p> : null}
      <div className="admin-push__actions">
        {status === 'subscribed' ? (
          <Button variant="secondary" disabled={busy} onClick={() => void disable()}>
            {busy ? 'Отключение…' : 'Отключить уведомления'}
          </Button>
        ) : (
          <Button variant="primary" disabled={busy || status === 'denied'} onClick={() => void enable()}>
            {busy ? 'Подключение…' : 'Включить уведомления'}
          </Button>
        )}
      </div>
    </div>
  );
}
