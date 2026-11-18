import { createContext } from 'react';
import type { AuthUser, Credentials } from '../domain/auth.types';

export interface AuthContextValue {
  readonly user: AuthUser | null;
  login(credentials: Credentials): Promise<void>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
