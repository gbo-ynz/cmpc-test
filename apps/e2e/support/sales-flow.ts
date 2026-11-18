import { expect, type Page } from '@playwright/test';
import { BookDetailPage } from './pages/book-detail.page';
import type { BookData } from './test-data';

/** Picks the book in "Nueva venta", sets the quantity and creates the pending sale. */
export async function createSale(page: Page, book: BookData, quantity: string): Promise<void> {
  await page.goto('/sales/new');
  await page.getByLabel('Buscar libro').fill(book.title);
  await page.getByRole('button', { name: `Agregar ${book.title}` }).click();
  await page.getByLabel(`Cantidad de ${book.title}`).fill(quantity);
  await page.getByRole('button', { name: 'Crear venta' }).click();
  await expect(page.getByRole('heading', { name: 'Venta', exact: true })).toBeVisible();
}

/** Opens the book detail and checks the stock line, e.g. "3 unidades". */
export async function expectStock(
  page: Page,
  bookId: string,
  book: BookData,
  stock: string,
): Promise<void> {
  const detail = new BookDetailPage(page);
  await page.goto(`/books/${bookId}`);
  await expect(detail.heading(book.title)).toBeVisible();
  await expect(detail.detail('Stock')).toHaveText(stock);
}
