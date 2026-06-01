import { Button } from '@/shared/ui/Button';
import { isNativeApp } from '@/shared/capacitor/isNativeApp';
import { getPushUnsupportedMessage, getNativePushDeniedMessage } from './adminPushUnsupportedMessage';
import { useBrowserPush } from './useAdminPush';
import { useNativeFcmPush } from './useNativeFcmPush';

type Props = {
  description: string;
  ariaLabel?: string;
};

function BrowserPushBanner({ description, ariaLabel }: Props) {
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
    <PushBannerControls
      description={description}
      ariaLabel={ariaLabel}
      status={status}
      errorMessage={errorMessage}
      busy={busy}
      enable={enable}
      disable={disable}
      deniedHint="Уведомления заблокированы в настройках браузера — разрешите их для этого сайта."
    />
  );
}

function NativePushBanner({ description, ariaLabel }: Props) {
  const { status, errorMessage, busy, enable, disable } = useNativeFcmPush();

  if (status === 'loading' || status === 'unsupported') {
    return null;
  }

  if (status === 'server_disabled') {
    return (
      <div className="admin-push admin-push--muted" role="status">
        <p className="admin-push__text">
          FCM на сервере не настроен (Firebase в .env backend). Лента в разделе «Оповещения» работает.
        </p>
      </div>
    );
  }

  return (
    <PushBannerControls
      description={description}
      ariaLabel={ariaLabel}
      status={status}
      errorMessage={errorMessage}
      busy={busy}
      enable={enable}
      disable={disable}
      deniedHint={getNativePushDeniedMessage()}
    />
  );
}

type ControlsProps = {
  description: string;
  ariaLabel?: string;
  status: 'idle' | 'subscribed' | 'denied' | 'error';
  errorMessage: string | null;
  busy: boolean;
  enable: () => void;
  disable: () => void;
  deniedHint: string;
};

function PushBannerControls({
  description,
  ariaLabel,
  status,
  errorMessage,
  busy,
  enable,
  disable,
  deniedHint,
}: ControlsProps) {
  return (
    <div className="admin-push" role="region" aria-label={ariaLabel ?? 'Push-уведомления'}>
      <p className="admin-push__text">{description}</p>
      {status === 'denied' ? <p className="admin-push__hint">{deniedHint}</p> : null}
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

export function PushBanner(props: Props) {
  if (isNativeApp()) {
    return <NativePushBanner {...props} />;
  }
  return <BrowserPushBanner {...props} />;
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
