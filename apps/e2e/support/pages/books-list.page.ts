import { expect, type Locator, type Page } from '@playwright/test';

export class BooksListPage {
  readonly heading: Locator;
  readonly search: Locator;
  readonly total: Locator;
  readonly emptyState: Locator;
  readonly titleLinks: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Inventario de libros' });
    this.search = page.getByLabel('Buscar');
    this.total = page.locator('.page__header .muted');
    this.emptyState = page.getByText('No se encontraron libros');
    this.titleLinks = page.locator('tbody .table__title');
  }

  async goto(): Promise<void> {
    await this.page.goto('/books');
    await expect(this.heading).toBeVisible();
  }

  async searchFor(text: string): Promise<void> {
    await this.search.fill(text);
  }

  filter(label: 'Género' | 'Editorial' | 'Autor' | 'Disponibilidad'): Locator {
    return this.page.getByRole('search').getByLabel(label);
  }

  sortBy(column: string): Promise<void> {
    return this.page.getByRole('columnheader', { name: column }).getByRole('button').click();
  }

  columnHeader(column: string): Locator {
    return this.page.getByRole('columnheader', { name: column });
  }

  row(title: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('link', { name: title, exact: true }) });
  }

  async titles(): Promise<string[]> {
    return this.titleLinks.allTextContents();
  }

  pageButton(name: 'Anterior' | 'Siguiente'): Locator {
    return this.page.getByRole('navigation', { name: 'Paginación' }).getByRole('button', { name });
  }

  exportCsv(): Promise<void> {
    return this.page.getByRole('button', { name: 'Exportar CSV' }).click();
  }
}
