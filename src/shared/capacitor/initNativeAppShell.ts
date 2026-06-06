import { isNativeApp } from './isNativeApp';

/** Класс на `<html>`: в APK margins WebView уже учитывают system bars (adjustMarginsForEdgeToEdge). */
export function initNativeAppShell(): void {
  if (isNativeApp()) {
    document.documentElement.classList.add('native-app');
  }
}
