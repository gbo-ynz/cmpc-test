import { expect, test } from '@playwright/test';
import { showRow } from '../support/paged-table';

// The stored session (auth.setup.ts) is an administrator. The author is removed at the end.
test('an administrator creates an author with details, edits it and deletes it', async ({
  page,
}) => {
  const name = `Autora E2E ${Date.now()}`;
  const row = () => page.getByRole('row', { name: new RegExp(name) });
  await page.goto('/authors');

  await page.getByRole('link', { name: 'Agregar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nuevo autor' })).toBeVisible();
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('Fecha de nacimiento').fill('1889-04-07');
  await page.getByLabel('Biografía').fill('Poeta y educadora.');
  await page.getByRole('button', { name: 'Agregar', exact: true }).click();
  await showRow(page, new RegExp(name));
  await expect(row()).toContainText('Poeta y educadora.');
  await expect(row().locator('time')).toHaveAttribute('datetime', '1889-04-07');

  await page.getByRole('link', { name: `Editar ${name}`, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Editar autor' })).toBeVisible();
  await expect(page.getByLabel('Fecha de nacimiento')).toHaveValue('1889-04-07');
  await page.getByLabel('Biografía').fill('Poeta chilena, Premio Nobel 1945.');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Los cambios se guardaron correctamente.')).toBeVisible();

  await page.getByRole('link', { name: '← Volver a autores' }).click();
  await showRow(page, new RegExp(name));
  await expect(row()).toContainText('Poeta chilena, Premio Nobel 1945.');
  await page.getByRole('button', { name: `Eliminar ${name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Sí, eliminar' }).click();
  await expect(row()).toHaveCount(0);
});
