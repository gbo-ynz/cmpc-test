import { expect, test } from '@playwright/test';
import { BooksApi } from '../support/books-api';
import { createSale, expectStock, latestSaleRow } from '../support/sales-flow';
import { uniqueBook, type BookData } from '../support/test-data';

// The stored session (auth.setup.ts) is an administrator. The book is soft deleted at the end.
let book: BookData;
let bookId: string;

test.beforeEach(async ({ request }) => {
  book = uniqueBook({ price: '2500', stock: '3' });
  bookId = await new BooksApi(request).create(book);
});

test.afterEach(async ({ request }) => {
  await new BooksApi(request).remove(bookId);
});

test('creating a sale lands on the list; completing it discounts the stock and makes it final', async ({
  page,
}) => {
  await createSale(page, book, '2');
  const row = latestSaleRow(page);
  await expect(row).toContainText('$5.000');
  await expect(row.getByRole('cell').nth(1)).toHaveText('2'); // units, not distinct books
  await expectStock(page, bookId, book, '3 unidades');

  await page.goto('/sales');
  await row.getByRole('button', { name: /^Completar venta/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Completar venta' });
  await dialog.getByLabel('Método de pago').selectOption('Efectivo');
  await dialog.getByRole('button', { name: 'Aceptar' }).click();
  await expect(dialog).toHaveCount(0);

  await expect(row).toContainText('Completada');
  await expect(row.getByRole('button')).toHaveCount(0);
  await expectStock(page, bookId, book, '1 unidad');
  await page.goto('/sales');
  await row.getByRole('link', { name: /^Ver venta/ }).click();
  await expect(page.getByText('Efectivo')).toBeVisible();
  await expect(page.getByRole('link', { name: book.title })).toBeVisible();
});

test('cancelling from the list leaves the stock untouched', async ({ page }) => {
  await createSale(page, book, '3');
  const row = latestSaleRow(page);

  await row.getByRole('button', { name: /^Cancelar venta/ }).click();
  await row.getByRole('button', { name: 'Sí, cancelar' }).click();

  await expect(row).toContainText('Cancelada');
  await expect(row.getByRole('button')).toHaveCount(0);
  await expectStock(page, bookId, book, '3 unidades');
});

test('completing fails and discounts nothing when the book was deleted meanwhile', async ({
  page,
  request,
}) => {
  await createSale(page, book, '3');
  await new BooksApi(request).remove(bookId);
  const row = latestSaleRow(page);

  await row.getByRole('button', { name: /^Completar venta/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Completar venta' });
  await dialog.getByLabel('Método de pago').selectOption('Transferencia');
  await dialog.getByRole('button', { name: 'Aceptar' }).click();

  await expect(dialog.getByRole('alert')).toContainText('No se descontó nada');
  await dialog.getByRole('button', { name: 'Volver' }).click();
  await expect(row).toContainText('Pendiente');
});
