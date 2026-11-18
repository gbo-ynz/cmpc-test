import { expect, test } from '@playwright/test';
import { BookDetailPage } from '../support/pages/book-detail.page';
import { BookFormPage } from '../support/pages/book-form.page';
import { BooksListPage } from '../support/pages/books-list.page';
import { COVER_IMAGE, uniqueBook } from '../support/test-data';

// Editing has its own spec (book-edit.spec.ts): saving now stays on the form.
test('creates a book with a cover, shows its detail and deletes it', async ({ page }) => {
  const book = uniqueBook({ genre: `Género E2E ${Date.now()}` });
  const list = new BooksListPage(page);
  const form = new BookFormPage(page);
  const detail = new BookDetailPage(page);

  await test.step('reactive validation blocks an invalid form', async () => {
    await list.goto();
    await page.getByRole('link', { name: 'Nuevo libro' }).click();
    await form.fill({ ...book, title: '' });
    await form.field('Título').fill('x');
    await form.field('Título').clear();
    await expect(form.fieldError('Título')).toHaveText('Ingrese el título');
    await expect(form.submitButton('Crear libro')).toBeDisabled();
  });

  await test.step('creates the book with a cover image', async () => {
    await form.fill({ title: book.title });
    await form.cover.setInputFiles(COVER_IMAGE);
    await form.submitButton('Crear libro').click();
    await expect(detail.heading(book.title)).toBeVisible();
    await expect(detail.detail('Autor')).toHaveText(book.author);
    await expect(detail.cover).toBeVisible();
    await expect
      .poll(() => detail.cover.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
  });

  await test.step('soft deletes it and it disappears from the list', async () => {
    await detail.delete.click();
    await detail.confirmDelete.click();
    await expect(list.heading).toBeVisible();
    await list.searchFor(book.title);
    await expect(list.emptyState).toBeVisible();
  });

  await test.step('its genre, now without active books, leaves the filters', async () => {
    await page.reload();
    await expect(list.filter('Género').locator('option')).not.toHaveCount(1);
    await expect(list.filter('Género').getByRole('option', { name: book.genre })).toHaveCount(0);
  });
});
