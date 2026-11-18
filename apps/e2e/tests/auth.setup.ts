import { expect, test as setup, type APIRequestContext } from '@playwright/test';
import { LoginPage } from '../support/pages/login.page';
import { DEMO_USER, SESSION_FILE, msUntilExpiry, readStoredToken } from '../support/session';

const MIN_REMAINING_MS = 5 * 60_000;

/**
 * Login is rate limited (5/min), so a stored session is reused, but only if the API still accepts
 * it: expiry alone is not enough (e.g. the database was reset and the user no longer exists).
 */
async function hasValidSession(request: APIRequestContext): Promise<boolean> {
  const token = readStoredToken();
  if (!token || msUntilExpiry(token) < MIN_REMAINING_MS) return false;
  const response = await request.get('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.ok();
}

setup(
  'signs in, returns to the requested page and stores the session',
  async ({ page, request }) => {
    setup.skip(await hasValidSession(request), 'Stored session is still accepted by the API');
    const login = new LoginPage(page);

    await page.goto('/books/new');
    await expect(page).toHaveURL(/\/login$/);
    await login.login(DEMO_USER.email, DEMO_USER.password);

    await expect(page.getByRole('heading', { name: 'Nuevo libro' })).toBeVisible();
    await page.context().storageState({ path: SESSION_FILE });
  },
);
