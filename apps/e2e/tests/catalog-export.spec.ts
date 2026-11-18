import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

// The stored session (auth.setup.ts) is an administrator. The demo seed provides the rows.
const CATALOGS = [
  { path: 'authors', file: 'autores', header: 'Fecha de nacimiento', sample: 'Gabriela Mistral' },
  { path: 'publishers', file: 'editoriales', header: 'País', sample: 'Sudamericana' },
  { path: 'genres', file: 'generos', header: 'Descripción', sample: 'Poesía' },
] as const;

for (const { path, file, header, sample } of CATALOGS) {
  test(`an administrator exports the whole ${path} catalog as CSV`, async ({ page }) => {
    await page.goto(`/${path}`);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Exportar CSV' }).click(),
    ]);
    const csv = await readFile(await download.path(), 'utf8');
    const lines = csv.trim().split(/\r?\n/);

    expect(download.suggestedFilename()).toMatch(
      new RegExp(`^${file}-\\d{4}-\\d{2}-\\d{2}\\.csv$`),
    );
    expect(lines[0]).toContain(header);
    expect(csv).toContain(sample);
    expect(lines.length).toBeGreaterThan(1);
  });
}
