import { expect, test } from '@playwright/test';
import { LoginPage } from '../support/pages/login.page';
import { REGULAR_USER } from '../support/session';

// The stored session (auth.setup.ts) is an administrator.
test('an administrator creates, renames and deletes a genre', async ({ page }) => {
  const name = `Género admin ${Date.now()}`;
  const cell = (text: string) => page.getByRole('cell', { name: text, exact: true });
  await page.goto('/genres');

  await page.getByLabel('Nuevo género').fill(name);
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await expect(cell(name)).toBeVisible();

  await page.getByRole('button', { name: `Renombrar ${name}`, exact: true }).click();
  await page.getByLabel(`Nuevo nombre de ${name}`).fill(`${name} bis`);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(cell(`${name} bis`)).toBeVisible();

  await page.getByRole('button', { name: `Eliminar ${name} bis`, exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(cell(`${name} bis`)).toHaveCount(0);
});

test('a genre that still has books cannot be deleted', async ({ page }) => {
  await page.goto('/genres');

  await page.getByRole('button', { name: 'Eliminar Novela', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();

  await expect(page.getByRole('alert')).toHaveText('No se puede eliminar: tiene libros asociados.');
});

test.describe('regular user', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sees only the inventory and cannot open administration pages', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(REGULAR_USER.email, REGULAR_USER.password);

    const menu = page.getByRole('navigation', { name: 'Principal' });
    await expect(menu.getByRole('link')).toHaveText(['Inventario']);
    await page.goto('/authors');
    await expect(
      page.getByRole('heading', { name: 'No tiene permisos para ver esta página' }),
    ).toBeVisible();
  });
});
