import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SESSION_EXPIRED_EVENT } from '../../../shared/api/http-client';
import { sessionStorage } from '../../../shared/auth/session-storage';
import type { Credentials, Session } from '../domain/auth.types';
import { authApi } from '../infrastructure/auth.api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => sessionStorage.read());

  const logout = useCallback(() => {
    sessionStorage.clear();
    setSession(null);
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const newSession = await authApi.login(credentials);
    sessionStorage.write(newSession);
    setSession(newSession);
  }, []);

  // The HTTP client emits this event on any 401 (expired or revoked token).
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user: session?.user ?? null, login, logout }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
