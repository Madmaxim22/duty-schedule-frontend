export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isAndroidDevice(): boolean {
  return /Android/i.test(navigator.userAgent);
}

/** Chromium-форк; beforeinstallprompt может не приходить или вести себя иначе, чем в Chrome. */
export function isYandexBrowser(): boolean {
  return /YaBrowser/i.test(navigator.userAgent);
}
