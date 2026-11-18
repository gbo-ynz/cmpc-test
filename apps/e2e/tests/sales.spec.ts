import { expect, test } from '@playwright/test';
import { BooksApi } from '../support/books-api';
import { createSale, expectStock } from '../support/sales-flow';
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

test('a pending sale discounts the stock only when it is completed, and then it is final', async ({
  page,
}) => {
  await createSale(page, book, '2');
  await expect(page.locator('.badge', { hasText: 'Pendiente' })).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(book.title) })).toContainText('$5.000');
  await expectStock(page, bookId, book, '3 unidades');

  await page.goBack();
  await page.getByLabel('Método de pago').selectOption('Efectivo');
  await page.getByRole('button', { name: 'Completar venta' }).click();

  await expect(page.locator('.badge', { hasText: 'Completada' })).toBeVisible();
  await expect(page.getByText('Efectivo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Completar venta' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Cancelar venta' })).toHaveCount(0);
  await expectStock(page, bookId, book, '1 unidad');
});

test('cancelling a pending sale leaves the stock untouched', async ({ page }) => {
  await createSale(page, book, '3');

  await page.getByRole('button', { name: 'Cancelar venta' }).click();
  await page.getByRole('button', { name: 'Sí, cancelar' }).click();

  await expect(page.locator('.badge', { hasText: 'Cancelada' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Completar venta' })).toHaveCount(0);
  await expectStock(page, bookId, book, '3 unidades');
});

test('completing fails and discounts nothing when the book was deleted meanwhile', async ({
  page,
  request,
}) => {
  await createSale(page, book, '3');
  await new BooksApi(request).remove(bookId);

  await page.getByLabel('Método de pago').selectOption('Transferencia');
  await page.getByRole('button', { name: 'Completar venta' }).click();

  await expect(page.getByRole('alert')).toContainText('No se descontó nada');
  await expect(page.locator('.badge', { hasText: 'Pendiente' })).toBeVisible();
});
