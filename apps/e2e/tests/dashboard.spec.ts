import { expect, test } from '@playwright/test';
import { BooksApi } from '../support/books-api';
import { uniqueBook } from '../support/test-data';

// The stored session (auth.setup.ts) is an administrator.
test('an administrator lands on the dashboard, whose figures follow the real data', async ({
  page,
  request,
}) => {
  const activeBooks = page.locator('.stat-card', { hasText: 'Libros activos' }).locator('dd');
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Resumen general del sistema')).toBeVisible();
  for (const section of ['Inventario', 'Ventas', 'Libros por género', 'Administración']) {
    await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible();
  }
  await expect(page.getByText('Valor del inventario disponible')).toBeVisible();
  const before = Number(await activeBooks.textContent());

  const book = uniqueBook({ stock: '3' });
  const bookId = await new BooksApi(request).create(book);
  try {
    await page.reload();
    await expect(activeBooks).toHaveText(String(before + 1));
    await expect(
      page.getByRole('row', { name: new RegExp(`Creó libro ${book.title}`) }),
    ).toBeVisible();
  } finally {
    await new BooksApi(request).remove(bookId);
  }
});
