import { expect, test } from '@playwright/test';
import { BooksListPage } from '../support/pages/books-list.page';
import { LoginPage } from '../support/pages/login.page';
import { DEMO_USER } from '../support/session';

test.describe('authentication', () => {
  // Starts signed out: these specs exercise the login itself.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('redirects anonymous users to the login page', async ({ page }) => {
    await page.goto('/books');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('validates the form before calling the API', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.email.fill('no-es-un-correo');
    await login.email.blur();

    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('rejects wrong credentials with a friendly message', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await login.login(DEMO_USER.email, 'ClaveIncorrecta1!');

    await expect(login.serverError).toBeVisible();
    await expect(page.getByText('Correo electrónico o contraseña incorrectos.')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

// Uses the stored session (no extra login): successful sign-in is covered by auth.setup.ts.
test('signs out and protected pages are no longer reachable', async ({ page }) => {
  const list = new BooksListPage(page);
  await list.goto();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/books');
  await expect(page).toHaveURL(/\/login$/);
  await expect(list.heading).toBeHidden();
});
