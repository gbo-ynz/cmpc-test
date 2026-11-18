import { expect, test } from '@playwright/test';
import { LoginPage } from '../support/pages/login.page';

// The stored session (auth.setup.ts) is an administrator. Login is rate limited (5/min), so the new
// user signs in once and its access is checked again by reloading with the token it already has.
test('an administrator creates a user who can sign in, edits it and deactivates it', async ({
  page,
  browser,
}) => {
  const stamp = Date.now();
  const name = `Usuario E2E ${stamp}`;
  const email = `e2e-${stamp}@cmpc.cl`;
  const password = 'ClaveE2E-123';
  const row = () => page.getByRole('row', { name: new RegExp(name) });
  await page.goto('/users');

  await page.getByRole('link', { name: 'Agregar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nuevo usuario' })).toBeVisible();
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(row()).toContainText(email);
  await expect(row()).toContainText('Usuario');

  await page.getByRole('link', { name: `Editar ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Editar usuario' })).toBeVisible();
  await expect(page.getByLabel('Nueva contraseña')).toHaveValue('');
  await page.getByLabel('Nombre').fill(`${name} editado`);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();
  await page.getByRole('link', { name: '← Volver a usuarios' }).click();
  await expect(row()).toContainText('editado');

  // Contexts inherit the stored administrator session: start this one signed out.
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const newcomer = await context.newPage();
  const login = new LoginPage(newcomer);
  await login.goto();
  await login.login(email, password);
  await expect(newcomer).toHaveURL(/\/dashboard$/);

  await page.getByRole('button', { name: `Eliminar ${name} editado`, exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(row()).toHaveCount(0);

  await newcomer.reload();
  await expect(newcomer).toHaveURL(/\/login/);
  await context.close();
});

test('the signed-in administrator can be edited but not deleted from the list', async ({
  page,
}) => {
  await page.goto('/users');
  await expect(page.getByRole('heading', { name: 'Usuarios' })).toBeVisible();
  const adminRow = page.getByRole('row', { name: /admin@cmpc\.cl/ });

  await expect(adminRow).toBeVisible();
  await expect(adminRow.getByRole('link', { name: /^Editar/ })).toBeVisible();
  await expect(adminRow.getByRole('button')).toHaveCount(0);
});
