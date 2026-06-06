import { App } from '@capacitor/app';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNativeApp } from './isNativeApp';

type BackHandler = () => boolean;

const NativeBackHandlerContext = createContext<((handler: BackHandler) => () => void) | null>(
  null,
);

const ROOT_PATHS = new Set(['/', '/login', '/register']);

export function NativeBackHandlerProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const handlersRef = useRef<BackHandler[]>([]);

  const register = useCallback((handler: BackHandler) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter((item) => item !== handler);
    };
  }, []);

  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;

    void App.addListener('backButton', ({ canGoBack }) => {
      for (let i = handlersRef.current.length - 1; i >= 0; i -= 1) {
        if (handlersRef.current[i]()) {
          return;
        }
      }

      const onRoot = ROOT_PATHS.has(location.pathname);

      if (canGoBack && !onRoot) {
        navigate(-1);
        return;
      }

      if (onRoot) {
        void App.exitApp();
        return;
      }

      navigate(-1);
    }).then((handle) => {
      removeListener = () => {
        void handle.remove();
      };
    });

    return () => {
      removeListener?.();
    };
  }, [location.pathname, navigate]);

  return (
    <NativeBackHandlerContext.Provider value={register}>
      {children}
    </NativeBackHandlerContext.Provider>
  );
}

/** Закрывает оверлей (модалку, меню) по системному «назад» в APK. */
export function useNativeBackHandler(active: boolean, onBack: () => void) {
  const register = useContext(NativeBackHandlerContext);

  useEffect(() => {
    if (!active || !register || !isNativeApp()) return;

    return register(() => {
      onBack();
      return true;
    });
  }, [active, onBack, register]);
}
