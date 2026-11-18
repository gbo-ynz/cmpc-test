import type { Locator, Page } from '@playwright/test';
import type { BookData } from '../test-data';

type TextFieldName = 'Título' | 'Autor' | 'Editorial' | 'Género' | 'Precio (CLP)';

const FIELD_BY_KEY: Record<keyof BookData, TextFieldName> = {
  title: 'Título',
  author: 'Autor',
  publisher: 'Editorial',
  genre: 'Género',
  price: 'Precio (CLP)',
};

export class BookFormPage {
  readonly available: Locator;
  readonly cover: Locator;

  constructor(private readonly page: Page) {
    this.available = page.getByLabel('Disponible para la venta');
    this.cover = page.getByLabel('Imagen de portada');
  }

  field(name: TextFieldName): Locator {
    return this.page.getByLabel(name, { exact: true });
  }

  async fill(data: Partial<BookData>): Promise<void> {
    for (const [key, value] of Object.entries(data) as Array<[keyof BookData, string]>) {
      await this.field(FIELD_BY_KEY[key]).fill(value);
    }
  }

  submitButton(name: 'Crear libro' | 'Guardar cambios'): Locator {
    return this.page.getByRole('button', { name });
  }

  fieldError(name: TextFieldName): Locator {
    return this.page.locator('.field', { has: this.field(name) }).getByRole('alert');
  }
}
