import { usePwaInstall } from '@/features/settings/usePwaInstall';
import {
  isAndroidDevice,
  isIosDevice,
  isStandaloneDisplay,
  isYandexBrowser,
} from '@/features/settings/pwa-platform';

export function PwaInstallSection() {
  const { canInstall, promptInstall, installOutcome } = usePwaInstall();
  const installed = isStandaloneDisplay();
  const ios = isIosDevice();

  if (installed) {
    return (
      <p className="pwa-install__status" role="status">
        Приложение открыто с рабочего стола. Чтобы сменить иконку на ярлыке, удалите ярлык и
        установите заново после выбора другого варианта выше.
      </p>
    );
  }

  if (installOutcome === 'accepted') {
    return (
      <p className="pwa-install__status pwa-install__status--success" role="status">
        Установка завершена. Ярлык появится на рабочем столе или в списке приложений.
      </p>
    );
  }

  if (canInstall) {
    return (
      <div className="pwa-install">
        <button type="button" className="pwa-install__btn" onClick={() => void promptInstall()}>
          Установить на устройство
        </button>
        <p className="pwa-install__hint">
          Сначала выберите иконку выше — она будет использована при установке.
        </p>
      </div>
    );
  }

  if (ios) {
    return (
      <ol className="pwa-install__steps">
        <li>
          Нажмите <strong>Поделиться</strong>{' '}
          <span className="pwa-install__ios-icon" aria-hidden>
            ⎋
          </span>{' '}
          в Safari (внизу экрана).
        </li>
        <li>
          Выберите <strong>На экран «Домой»</strong>.
        </li>
        <li>Нажмите <strong>Добавить</strong>.</li>
      </ol>
    );
  }

  if (isYandexBrowser()) {
    return (
      <div className="pwa-install">
        <p className="pwa-install__hint">
          В Яндекс Браузере кнопка «Установить» в приложении часто <strong>недоступна</strong> —
          браузер не передаёт сайту событие установки PWA (в отличие от Chrome).
        </p>
        <ol className="pwa-install__steps">
          {isAndroidDevice() ? (
            <>
              <li>
                Меню <strong>☰</strong> (три полоски) →{' '}
                <strong>Добавить на главный экран</strong> или <strong>Установить приложение</strong>.
              </li>
              <li>Сначала выберите иконку выше — ярлык создаётся с текущей.</li>
            </>
          ) : (
            <>
              <li>
                Меню <strong>⋮</strong> → <strong>Дополнительно</strong> →{' '}
                <strong>Установить приложение</strong> (если пункт есть).
              </li>
              <li>
                Либо откройте сайт в <strong>Chrome</strong> / <strong>Edge</strong> — там может
                появиться кнопка «Установить на устройство» в настройках.
              </li>
            </>
          )}
        </ol>
        <p className="pwa-install__hint pwa-install__hint--muted">Нужен HTTPS (например duty-w.ru).</p>
      </div>
    );
  }

  return (
    <div className="pwa-install">
      <p className="pwa-install__hint">
        Установка через браузер: меню{' '}
        <strong>⋮ → Установить приложение</strong> (Chrome, Edge) или{' '}
        <strong>⋯ → Поделиться → Установить</strong> (Samsung Internet). Нужен HTTPS.
      </p>
      <p className="pwa-install__hint pwa-install__hint--muted">
        Кнопка «Установить» в приложении появляется только если браузер отправил событие{' '}
        <code>beforeinstallprompt</code> (обычно Chrome/Edge на Android и desktop).
      </p>
    </div>
  );
}
