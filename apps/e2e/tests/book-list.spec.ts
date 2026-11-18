import { expect, test } from '@playwright/test';
import { PRICES, UNAVAILABLE_COUNT, useGenreBooks } from '../support/genre-fixture';

const { list } = useGenreBooks(test);

test('filters combine: genre + availability', async () => {
  await list().filter('Disponibilidad').selectOption({ label: 'No disponible' });

  await expect(list().total).toHaveText(`${UNAVAILABLE_COUNT} libros`);
});

test('search is debounced: one request after the user stops typing', async ({ page }) => {
  const searches: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('search=Lista')) searches.push(request.url());
  });

  await list().search.pressSequentially('Lista 10', { delay: 30 });

  await expect(list().titleLinks).toHaveCount(1);
  expect(searches).toHaveLength(1);
});

test('sorts by several columns and paginates on the server', async () => {
  const books = list();
  await books.sortBy('Precio');
  await expect(books.columnHeader('Precio')).toHaveAttribute('aria-sort', 'ascending');
  await expect(books.titleLinks.first()).toHaveText(/^E2E Lista 1 /);

  await books.sortBy('Precio');
  await expect(books.columnHeader('Precio')).toHaveAttribute('aria-sort', 'descending');
  await expect(books.titleLinks.first()).toHaveText(/^E2E Lista 10 /);

  await books.sortBy('Título');
  await expect(books.columnHeader('Título')).toContainText('2');

  await books.pageButton('Siguiente').click();
  await expect(books.titleLinks).toHaveCount(PRICES.length - 10);
  await expect(books.titleLinks.first()).toHaveText(/^E2E Lista 1 /);
});
