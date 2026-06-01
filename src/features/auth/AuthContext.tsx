import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest, setAccessToken, getAccessToken } from '@/shared/api/client';
import type { User } from '@/shared/api/types';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const data = await apiRequest<{ user: User }>('/auth/me');
      setUser(data.user);
    } catch {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const data = await apiRequest<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
        skipAuth: true,
      });
      return data.message;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      const { unsubscribePushOnLogout } = await import('@/features/push/unsubscribePushOnLogout');
      await unsubscribePushOnLogout();
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const setUserFromClient = useCallback((next: User) => {
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refreshUser, setUser: setUserFromClient }),
    [user, isLoading, login, register, logout, refreshUser, setUserFromClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
