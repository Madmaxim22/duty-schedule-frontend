import type { PushUnsupportedReason } from './useAdminPush';

export function getPushUnsupportedMessage(reason: PushUnsupportedReason | null): string {
  switch (reason) {
    case 'insecure':
      return (
        'Push работает только по HTTPS. Откройте сайт как https://duty-w.ru ' +
        '(адрес вида http://192.168… с телефона не подойдёт). ' +
        'Для локальной разработки используйте HTTPS-туннель (cloudflared) или проверку на ПК в Chrome.'
      );
    case 'missing_apis':
    case 'no_push_manager':
      return (
        'Этот браузер не поддерживает Web Push (или функция отключена). ' +
        'На Android попробуйте Chrome; в Яндекс.Браузере push может быть недоступен — откройте тот же сайт в Chrome.'
      );
    default:
      return (
        'Push недоступен в этом браузере. На iPhone: Safari 16.4+, сайт на экран «Домой». ' +
        'На Android: Chrome и HTTPS.'
      );
  }
}

export function getNativePushDeniedMessage(): string {
  return (
    'Уведомления отключены в системе. Откройте Настройки → Приложения → ' +
    '«График дежурств» → Уведомления и разрешите их.'
  );
}
