import type { Locator, Page } from '@playwright/test';
import type { BookData } from '../test-data';

type TextFieldName = 'Título' | 'Precio (CLP)' | 'Stock (unidades)';
type SelectName = 'Autor' | 'Editorial' | 'Género';

const TEXT_FIELDS = { title: 'Título', price: 'Precio (CLP)', stock: 'Stock (unidades)' } as const;
const SELECTS = { author: 'Autor', publisher: 'Editorial', genre: 'Género' } as const;

const isSelect = (key: keyof BookData): key is keyof typeof SELECTS => key in SELECTS;

export class BookFormPage {
  readonly cover: Locator;

  constructor(private readonly page: Page) {
    this.cover = page.getByLabel('Imagen de portada');
  }

  field(name: TextFieldName | SelectName): Locator {
    return this.page.getByLabel(name, { exact: true });
  }

  /** Types text fields and picks author, publisher and genre from their lists by name. */
  async fill(data: Partial<BookData>): Promise<void> {
    for (const [key, value] of Object.entries(data) as Array<[keyof BookData, string]>) {
      if (isSelect(key)) await this.field(SELECTS[key]).selectOption({ label: value });
      else await this.field(TEXT_FIELDS[key]).fill(value);
    }
  }

  submitButton(name: 'Crear libro' | 'Guardar cambios'): Locator {
    return this.page.getByRole('button', { name });
  }

  fieldError(name: TextFieldName): Locator {
    return this.page.locator('.field', { has: this.field(name) }).getByRole('alert');
  }
}
