import { expect, test, type Page } from '@playwright/test';
import { BooksApi } from '../support/books-api';
import { BookDetailPage } from '../support/pages/book-detail.page';
import { BookFormPage } from '../support/pages/book-form.page';
import { BooksListPage } from '../support/pages/books-list.page';
import { uniqueBook, type BookData } from '../support/test-data';

const SAVED = 'Los cambios se guardaron correctamente.';
let book: BookData;
let bookId: string;

test.beforeEach(async ({ request }) => {
  book = uniqueBook();
  bookId = await new BooksApi(request).create(book);
});

test.afterEach(async ({ request }) => {
  await new BooksApi(request).remove(bookId);
});

/** Saves a new price and checks the user stays on the form, with a confirmation and a clean form. */
async function savePriceAndStay(page: Page, price: string): Promise<void> {
  const form = new BookFormPage(page);
  await form.fill({ price });
  await form.submitButton('Guardar cambios').click();
  await expect(page.getByRole('status')).toHaveText(SAVED);
  await expect(page).toHaveURL(new RegExp(`/books/${bookId}/edit$`));
  await expect(form.field('Precio (CLP)')).toHaveValue(price);
  await expect(form.submitButton('Guardar cambios')).toBeDisabled();
}

test('from the list, "Editar" opens the form and saving stays on it', async ({ page }) => {
  const list = new BooksListPage(page);
  await list.goto();
  await list.searchFor(book.title);

  await list
    .row(book.title)
    .getByRole('link', { name: `Editar ${book.title}` })
    .click();

  await expect(page.getByRole('heading', { name: 'Editar libro' })).toBeVisible();
  await savePriceAndStay(page, '9990');
});

test('from the detail, saving stays on the form and the top link goes back to the inventory', async ({
  page,
}) => {
  const detail = new BookDetailPage(page);
  const list = new BooksListPage(page);
  await page.goto(`/books/${bookId}`);
  await detail.edit.click();

  await savePriceAndStay(page, '12990');
  await page.getByRole('link', { name: '← Volver al inventario' }).click();

  await expect(list.heading).toBeVisible();
  await list.searchFor(book.title);
  await list.row(book.title).getByRole('link', { name: book.title, exact: true }).click();
  await expect(detail.detail('Precio')).toContainText('12.990');
});
