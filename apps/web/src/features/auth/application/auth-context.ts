import { createContext } from 'react';
import type { AuthUser, Credentials } from '../domain/auth.types';

export interface AuthContextValue {
  readonly user: AuthUser | null;
  /**
   * True after a deliberate sign out, false when the session expired on its own: only an expired
   * session sends the user back to the page they were on after signing in again.
   */
  readonly signedOutByUser?: boolean;
  login(credentials: Credentials): Promise<void>;
  logout(): void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
