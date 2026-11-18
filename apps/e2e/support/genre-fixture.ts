import { expect, type test as base } from '@playwright/test';
import { BooksApi } from './books-api';
import { BooksListPage } from './pages/books-list.page';
import { uniqueBook } from './test-data';

// Unordered on purpose: index 1 is the cheapest and index 10 the most expensive.
export const PRICES = [5000, 1000, 9000, 3000, 7000, 2000, 8000, 4000, 6000, 10000, 11000];
export const UNAVAILABLE_COUNT = 5; // odd indexes

/**
 * Seeds books under a private genre (isolated from seed data and other runs), opens the list
 * filtered by it, and soft deletes the books afterwards.
 */
export function useGenreBooks(test: typeof base): { genre: string; list: () => BooksListPage } {
  const genre = `Género E2E ${Date.now()}`;
  const ids: string[] = [];
  let list: BooksListPage;

  test.beforeAll(async ({ request }) => {
    const api = new BooksApi(request);
    for (const [index, price] of PRICES.entries()) {
      const book = uniqueBook({
        genre,
        title: `E2E Lista ${index} ${genre}`,
        price: String(price),
        stock: index % 2 === 0 ? '3' : '0', // odd indexes are out of stock
      });
      ids.push(await api.create(book));
    }
  });

  test.afterAll(async ({ request }) => {
    const api = new BooksApi(request);
    for (const id of ids) await api.remove(id);
  });

  test.beforeEach(async ({ page }) => {
    list = new BooksListPage(page);
    await list.goto();
    await list.filter('Género').selectOption({ label: genre });
    await expect(list.total).toHaveText(`${PRICES.length} libros`);
  });

  return { genre, list: () => list };
}
