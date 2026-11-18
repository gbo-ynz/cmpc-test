import type { BookView } from './book-view';

type CsvValue = string | number | null;

// Column order and the header shown to the end user (opened in Excel).
const COLUMNS = [
  ['id', 'ID'],
  ['title', 'Título'],
  ['author', 'Autor'],
  ['publisher', 'Editorial'],
  ['genre', 'Género'],
  ['price', 'Precio'],
  ['stock', 'Stock'],
  ['isAvailable', 'Disponible'],
  ['createdAt', 'Fecha de alta'],
] as const satisfies readonly (readonly [keyof BookView, string])[];

// Cells starting with these characters are executed as formulas by spreadsheets.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const NEEDS_QUOTING = /[",\r\n]/;

export function escapeCsvValue(value: CsvValue): string {
  if (value === null) return '';
  const raw = String(value);
  const safe = typeof value === 'string' && FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;
  return NEEDS_QUOTING.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const toCsvLine = (values: readonly CsvValue[]): string =>
  `${values.map(escapeCsvValue).join(',')}\r\n`;

export const BOOK_CSV_HEADER = toCsvLine(COLUMNS.map(([, label]) => label));

const toCell = (value: BookView[keyof BookView]): CsvValue =>
  typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value;

export const bookToCsvLine = (book: BookView): string =>
  toCsvLine(COLUMNS.map(([key]) => toCell(book[key])));
