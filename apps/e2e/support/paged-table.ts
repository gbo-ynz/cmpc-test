import { expect, type Locator, type Page } from '@playwright/test';

/**
 * The admin tables paginate on the server (10 per page) and the data created by earlier runs
 * accumulates, so a record is not always on the first page: walk the pages until its row shows up.
 */
export async function showRow(page: Page, name: RegExp): Promise<Locator> {
  const row = page.getByRole('row', { name });
  const next = page.getByRole('button', { name: 'Siguiente' });
  const position = page.getByText(/^Página \d+ de \d+/);
  await position.waitFor();
  // Right after saving, the list still shows its cached pages: let the refetch land before walking.
  await page.waitForLoadState('networkidle');
  while ((await row.count()) === 0 && (await next.isEnabled())) {
    const before = await position.textContent();
    await next.click();
    await expect(position).not.toHaveText(before ?? '');
  }
  return row;
}
