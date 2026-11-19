import { expect, test } from '@playwright/test';
import { BooksApi } from '../support/books-api';
import { BookFormPage } from '../support/pages/book-form.page';
import { uniqueBook } from '../support/test-data';

// Among active books, title (ignoring case and extra spaces), author and publisher identify a book.
test('a book that already exists is rejected; once deleted it can be loaded again', async ({
  page,
  request,
}) => {
  const api = new BooksApi(request);
  const book = uniqueBook();
  const originalId = await api.create(book);
  const form = new BookFormPage(page);
  const ids = [originalId];

  try {
    await page.goto('/books/new');
    await form.fill({ ...book, title: `  ${book.title.toUpperCase()}  ` });
    await form.submitButton('Crear libro').click();

    await expect(page.getByRole('alert')).toContainText(
      'Ya existe un libro con ese título, autor y editorial.',
    );
    await expect(page).toHaveURL(/\/books\/new$/);

    await api.remove(originalId);
    await form.submitButton('Crear libro').click();
    await expect(page).toHaveURL(/\/books\/[0-9a-f-]{36}$/);
    ids.push(page.url().split('/').pop() ?? '');
  } finally {
    for (const id of ids) await api.remove(id);
  }
});
