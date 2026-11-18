import { escapeCsvValue, toCsvLine, type CsvValue } from '../../../shared/application/csv';
import type { BookView } from './book-view';

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

export { escapeCsvValue, toCsvLine };

export const BOOK_CSV_HEADER = toCsvLine(COLUMNS.map(([, label]) => label));

const toCell = (value: BookView[keyof BookView]): CsvValue =>
  typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value;

export const bookToCsvLine = (book: BookView): string =>
  toCsvLine(COLUMNS.map(([key]) => toCell(book[key])));
