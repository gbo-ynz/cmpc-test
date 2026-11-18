import { expect, test } from '@playwright/test';
import { showRow } from '../support/paged-table';

// The stored session (auth.setup.ts) is an administrator. The publisher is removed at the end.
test('an administrator creates a publisher with country, edits it and deletes it', async ({
  page,
}) => {
  const name = `Editorial E2E ${Date.now()}`;
  const row = () => page.getByRole('row', { name: new RegExp(name) });
  await page.goto('/publishers');

  await page.getByRole('link', { name: 'Agregar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nueva editorial' })).toBeVisible();
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('País').fill('Chile');
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await showRow(page, new RegExp(name));
  await expect(row()).toContainText('Chile');

  await page.getByRole('link', { name: `Editar ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Editar editorial' })).toBeVisible();
  await expect(page.getByLabel('País')).toHaveValue('Chile');
  await page.getByLabel('País').fill('Argentina');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();

  await page.getByRole('link', { name: '← Volver a editoriales' }).click();
  await showRow(page, new RegExp(name));
  await expect(row()).toContainText('Argentina');
  await page.getByRole('button', { name: `Eliminar ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(row()).toHaveCount(0);
});
