import { useEffect, useState } from 'react';
import { isNativeApp } from './isNativeApp';
import { initNativeAppShell } from './initNativeAppShell';

/** Повторная проверка после инъекции Capacitor-bridge (remote server.url). */
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(() => isNativeApp());

  useEffect(() => {
    if (native) {
      initNativeAppShell();
      return;
    }

    const recheck = () => {
      if (isNativeApp()) {
        setNative(true);
        initNativeAppShell();
      }
    };

    recheck();
    const timers = [50, 200, 500, 1000].map((ms) => window.setTimeout(recheck, ms));
    return () => timers.forEach(clearTimeout);
  }, [native]);

  return native;
}
