import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** Demo user created by the API seed (apps/api/prisma/seed.js). Overridable for other environments. */
export const DEMO_USER = {
  email: process.env.E2E_USER_EMAIL ?? 'admin@cmpc.cl',
  password: process.env.E2E_USER_PASSWORD ?? 'Admin123!',
};

export const SESSION_FILE = fileURLToPath(new URL('../.auth/session.json', import.meta.url));

const SESSION_KEY = 'cmpc.session'; // apps/web/src/shared/auth/session-storage.ts

interface StoredState {
  origins: Array<{ localStorage: Array<{ name: string; value: string }> }>;
}

/** JWT saved by auth.setup.ts in the browser's localStorage, or null when there is none. */
export function readStoredToken(): string | null {
  if (!existsSync(SESSION_FILE)) return null;
  const state = JSON.parse(readFileSync(SESSION_FILE, 'utf8')) as StoredState;
  const entry = state.origins
    .flatMap((origin) => origin.localStorage)
    .find(({ name }) => name === SESSION_KEY);
  return entry ? (JSON.parse(entry.value) as { token: string }).token : null;
}

/** Milliseconds until the token expires (reads the unverified `exp` claim; enough for a test). */
export function msUntilExpiry(token: string): number {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as {
    exp: number;
  };
  return payload.exp * 1000 - Date.now();
}
