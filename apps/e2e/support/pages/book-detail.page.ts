import type { Locator, Page } from '@playwright/test';

export class BookDetailPage {
  readonly cover: Locator;
  readonly edit: Locator;
  readonly delete: Locator;
  readonly confirmDelete: Locator;

  constructor(private readonly page: Page) {
    this.cover = page.getByRole('img', { name: /^Portada de / });
    this.edit = page.getByRole('link', { name: 'Editar' });
    this.delete = page.getByRole('button', { name: 'Eliminar' });
    this.confirmDelete = page.getByRole('button', { name: 'Sí, eliminar' });
  }

  heading(title: string): Locator {
    return this.page.getByRole('heading', { level: 1, name: title });
  }

  detail(term: string): Locator {
    return this.page.locator('.book-detail__list div', { hasText: term }).locator('dd');
  }
}
