import { Button } from '@/shared/ui/Button';
import { getPushUnsupportedMessage } from './adminPushUnsupportedMessage';
import { useBrowserPush } from './useAdminPush';

type Props = {
  description: string;
  ariaLabel?: string;
};

export function PushBanner({ description, ariaLabel = 'Push-уведомления' }: Props) {
  const { status, unsupportedReason, errorMessage, busy, enable, disable } = useBrowserPush();

  if (status === 'loading') {
    return null;
  }

  if (status === 'unsupported') {
    return (
      <div className="admin-push admin-push--muted" role="status">
        <p className="admin-push__text">{getPushUnsupportedMessage(unsupportedReason)}</p>
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
    <div className="admin-push" role="region" aria-label={ariaLabel}>
      <p className="admin-push__text">{description}</p>
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

/** @deprecated Use PushBanner */
export function AdminPushBanner() {
  return (
    <PushBanner
      description="Получать push при новой регистрации на сайте."
      ariaLabel="Уведомления о заявках"
    />
  );
}
