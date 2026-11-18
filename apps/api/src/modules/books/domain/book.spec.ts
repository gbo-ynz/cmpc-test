import { bookData } from '../../../test-utils/fakes';
import { Book } from './book';
import type { BookData } from './book-data';
import { BookNotFoundError, InvalidBookError } from './book.errors';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const LATER = new Date('2026-02-01T00:00:00.000Z');

describe('Book aggregate', () => {
  it('creates an active book with trimmed values', () => {
    const book = Book.create(bookData({ title: '  Rayuela  ' }), NOW);

    expect(book.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(book.isDeleted).toBe(false);
    expect(book.snapshot()).toMatchObject({ title: 'Rayuela', imageUrl: null, createdAt: NOW });
  });

  it.each<[Partial<BookData>, string]>([
    [{ title: '   ' }, 'title is required'],
    [{ title: 'x'.repeat(256) }, 'title must be at most 255 characters'],
    [{ author: undefined }, 'author is required'],
    [{ genre: { id: '', name: 'Sin id' } }, 'genre is required'],
    [{ stock: -1 }, 'stock must be a whole number between 0 and 1000000'],
    [{ stock: 2.5 }, 'stock must be a whole number between 0 and 1000000'],
  ])('enforces invariants (%#)', (override, message) => {
    expect(() => Book.create(bookData(override))).toThrow(new InvalidBookError(message));
  });

  it('updates immutably, ignoring undefined fields', () => {
    const original = Book.create(bookData(), NOW);

    const updated = original.update({ price: 9990, title: undefined }, LATER);

    expect(updated.snapshot()).toMatchObject({ price: expect.anything(), title: 'Rayuela' });
    expect(updated.snapshot().price.amount).toBe(9990);
    expect(updated.snapshot().updatedAt).toBe(LATER);
    expect(original.snapshot().price.amount).toBe(16990);
  });

  it('attaches an image', () => {
    const book = Book.create(bookData()).attachImage('/api/uploads/a.png', LATER);

    expect(book.snapshot().imageUrl).toBe('/api/uploads/a.png');
  });

  it('soft deletes and then refuses further changes', () => {
    const deleted = Book.create(bookData()).softDelete(LATER);

    expect(deleted.isDeleted).toBe(true);
    expect(deleted.snapshot().deletedAt).toBe(LATER);
    expect(() => deleted.update({ price: 1 })).toThrow(BookNotFoundError);
    expect(() => deleted.softDelete()).toThrow(BookNotFoundError);
  });

  it('restores from persisted props', () => {
    const props = Book.create(bookData(), NOW).snapshot();

    expect(Book.restore(props).snapshot()).toEqual(props);
  });
});
