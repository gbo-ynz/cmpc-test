import { expect, test } from '@playwright/test';
import { LoginPage } from '../support/pages/login.page';
import { DEMO_USER } from '../support/session';

// Signing out on purpose is not an expired session: the next login starts on the dashboard.
test('signing out from any page and back in lands on the dashboard', async ({ page }) => {
  await page.goto('/genres');
  await expect(page.getByRole('heading', { name: 'Géneros' })).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await new LoginPage(page).login(DEMO_USER.email, DEMO_USER.password);

  await expect(page).toHaveURL(/\/dashboard$/);
});
