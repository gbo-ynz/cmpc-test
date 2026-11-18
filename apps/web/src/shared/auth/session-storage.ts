export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: 'ADMIN' | 'USER';
}

export interface Session {
  readonly token: string;
  readonly user: AuthUser;
}

const STORAGE_KEY = 'cmpc.session';

const isSession = (value: unknown): value is Session =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Session).token === 'string' &&
  typeof (value as Session).user?.email === 'string';

/** Storage access can throw (private mode, blocked cookies): never crash the app. */
export const sessionStorage = {
  read(): Session | null {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      return isSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  write(session: Session): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Session will only live in memory for this tab.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
