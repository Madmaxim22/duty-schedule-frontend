import { isNativeApp } from './isNativeApp';

/** Класс на `<html>` для CSS: в Capacitor WebView safe-area у fixed-слоёв дублирует системный отступ. */
export function initNativeAppShell(): void {
  if (isNativeApp()) {
    document.documentElement.classList.add('native-app');
  }
}
