import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PRICES, useGenreBooks } from '../support/genre-fixture';

const { genre, list } = useGenreBooks(test);

test('exports exactly the filtered rows as CSV', async ({ page }) => {
  const [download] = await Promise.all([page.waitForEvent('download'), list().exportCsv()]);
  const csv = await readFile(await download.path(), 'utf8');
  const lines = csv.trim().split(/\r?\n/);

  expect(download.suggestedFilename()).toMatch(/^libros-\d{4}-\d{2}-\d{2}\.csv$/);
  expect(lines[0]).toContain('Título');
  expect(lines).toHaveLength(PRICES.length + 1);
  expect(lines.slice(1).every((line) => line.includes(genre))).toBe(true);
});
