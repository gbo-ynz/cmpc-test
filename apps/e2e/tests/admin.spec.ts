import { expect, test } from '@playwright/test';
import { showRow } from '../support/paged-table';
import { LoginPage } from '../support/pages/login.page';
import { REGULAR_USER } from '../support/session';

// The stored session (auth.setup.ts) is an administrator.
test('an administrator creates, edits and deletes a genre', async ({ page }) => {
  const name = `Género admin ${Date.now()}`;
  const row = () => page.getByRole('row', { name: new RegExp(name) });
  await page.goto('/genres');

  await page.getByRole('link', { name: 'Agregar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nuevo género' })).toBeVisible();
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('Descripción').fill('Obras de prueba.');
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await showRow(page, new RegExp(name));
  await expect(row()).toContainText('Obras de prueba.');

  await page.getByRole('link', { name: `Editar ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Editar género' })).toBeVisible();
  await expect(page.getByLabel('Descripción')).toHaveValue('Obras de prueba.');
  await page.getByLabel('Descripción').fill('Obras de prueba editadas.');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();

  await page.getByRole('link', { name: '← Volver a géneros' }).click();
  await showRow(page, new RegExp(name));
  await expect(row()).toContainText('Obras de prueba editadas.');
  await page.getByRole('button', { name: `Eliminar ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(row()).toHaveCount(0);
});

test('a genre that still has books cannot be deleted', async ({ page }) => {
  await page.goto('/genres');
  await showRow(page, /Novela/);

  await page.getByRole('button', { name: 'Eliminar Novela', exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();

  await expect(page.getByRole('alert')).toContainText(
    'No se puede eliminar: tiene libros asociados',
  );
});

test.describe('regular user', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sees the operation dashboard, inventory and sales, but no administration', async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(REGULAR_USER.email, REGULAR_USER.password);

    await expect(page).toHaveURL(/\/dashboard$/); // every profile lands on the dashboard
    const menu = page.getByRole('navigation', { name: 'Principal' });
    await expect(menu.getByRole('link')).toHaveText(['Dashboard', 'Inventario', 'Ventas']);
    await page.goto('/authors');
    await expect(
      page.getByRole('heading', { name: 'No tiene permisos para ver esta página' }),
    ).toBeVisible();

    await page.goto('/dashboard');
    await expect(page.getByText('Resumen de la operación')).toBeVisible();
    await expect(page.getByText('Libros activos')).toBeVisible();
    await expect(page.getByText('Administración', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Valor del inventario disponible')).toHaveCount(0);
    await expect(page.getByText('Actividad reciente')).toHaveCount(0);
  });
});
