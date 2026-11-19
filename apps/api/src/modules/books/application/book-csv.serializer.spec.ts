import { BOOK_CSV_HEADER, bookToCsvLine, escapeCsvValue } from './book-csv.serializer';
import type { BookView } from './book-view';

const VIEW: BookView = {
  id: 'b1',
  title: 'Hello, "World"',
  authorId: 'a1',
  author: 'Autor',
  publisherId: 'p1',
  publisher: 'Editorial',
  genreId: 'g1',
  genre: 'Novela',
  price: 1990,
  stock: 3,
  isAvailable: true,
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('book CSV serializer', () => {
  it('writes the header in column order', () => {
    expect(BOOK_CSV_HEADER).toBe(
      'ID,Título,Autor,Editorial,Género,Precio,Stock,Disponible,Fecha de alta\r\n',
    );
  });

  it('quotes values containing separators or quotes', () => {
    expect(bookToCsvLine(VIEW)).toBe(
      'b1,"Hello, ""World""",Autor,Editorial,Novela,1990,3,Sí,2026-01-01T00:00:00.000Z\r\n',
    );
  });

  it.each([
    ['=SUM(A1:A9)', "'=SUM(A1:A9)"],
    ['@cmd', "'@cmd"],
    ['line\nbreak', '"line\nbreak"'],
  ])('neutralizes CSV injection and escapes %p', (input, expected) => {
    expect(escapeCsvValue(input)).toBe(expected);
  });

  it('renders null as an empty cell and keeps negative numbers', () => {
    expect(escapeCsvValue(null)).toBe('');
    expect(escapeCsvValue(-5)).toBe('-5');
  });
});
