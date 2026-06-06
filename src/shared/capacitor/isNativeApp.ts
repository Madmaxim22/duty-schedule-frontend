import { Capacitor } from '@capacitor/core';

/** Маркер в User-Agent (capacitor.config.ts → appendUserAgent). */
export const CAPACITOR_UA_MARKER = 'DutyScheduleCapacitor';

/** Нативное хранилище доступно (SharedPreferences), а не localStorage WebView. */
export function hasNativeStorage(): boolean {
  if (Capacitor.isPluginAvailable('Preferences')) {
    return true;
  }
  return isNativeApp();
}

/**
 * APK / Capacitor WebView. При server.url=https://duty-w.ru иногда
 * Capacitor.isNativePlatform() кратко false до инъекции androidBridge.
 */
export function isNativeApp(): boolean {
  if (Capacitor.isNativePlatform()) {
    return true;
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    return true;
  }

  if (Capacitor.isPluginAvailable('PushNotifications')) {
    return true;
  }

  if (typeof navigator !== 'undefined' && navigator.userAgent.includes(CAPACITOR_UA_MARKER)) {
    return true;
  }

  return false;
}
