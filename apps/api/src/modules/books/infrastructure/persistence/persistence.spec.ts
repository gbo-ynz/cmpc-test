import { Prisma } from '@prisma/client';
import { makeBook } from '../../../../test-utils/fakes';
import { buildBookOrderBy, buildBookWhere } from './book-query.builder';
import { BookRecord, toDomain, toPersistence } from './book.mapper';

const RECORD: BookRecord = {
  id: '0b6d3c39-5b1f-4c9e-9a59-0b1f6b9c0001',
  title: 'Rayuela',
  price: new Prisma.Decimal('16990.50'),
  isAvailable: true,
  imageUrl: null,
  authorId: 'a1',
  publisherId: 'p1',
  genreId: 'g1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  deletedAt: null,
  author: { id: 'a1', name: 'Julio Cortázar' },
  publisher: { id: 'p1', name: 'Sudamericana' },
  genre: { id: 'g1', name: 'Novela' },
};

describe('book mapper', () => {
  it('maps a database record (with relations) to the aggregate', () => {
    const snapshot = toDomain(RECORD).snapshot();

    expect(snapshot).toMatchObject({ id: RECORD.id, author: 'Julio Cortázar', genre: 'Novela' });
    expect(snapshot.price.amount).toBe(16990.5);
  });

  it('maps the aggregate to a normalized write model', () => {
    const data = toPersistence(makeBook({ author: 'Borges' }));

    expect(data.price).toBe('16990.00');
    expect(data.author).toEqual({
      connectOrCreate: { where: { name: 'Borges' }, create: { name: 'Borges' } },
    });
  });
});

describe('book query builder', () => {
  it('always excludes soft-deleted rows and ignores absent filters', () => {
    expect(buildBookWhere({})).toEqual(expect.objectContaining({ deletedAt: null, OR: undefined }));
  });

  it('searches case-insensitively in title, author and publisher', () => {
    const where = buildBookWhere({ search: '  cort ', isAvailable: false, genreId: 'g1' });

    expect(where).toMatchObject({ isAvailable: false, genreId: 'g1' });
    expect(where.OR).toHaveLength(3);
    expect(where.OR?.[1]).toEqual({ author: { name: { contains: 'cort', mode: 'insensitive' } } });
  });

  it('defaults to newest first with a deterministic tie-breaker', () => {
    expect(buildBookOrderBy([])).toEqual([{ createdAt: 'desc' }, { id: 'asc' }]);
  });

  it('supports multi-field sorting including relations', () => {
    const orderBy = buildBookOrderBy([
      { field: 'author', direction: 'asc' },
      { field: 'price', direction: 'desc' },
      { field: 'title', direction: 'asc' },
      { field: 'publisher', direction: 'asc' },
      { field: 'genre', direction: 'desc' },
      { field: 'isAvailable', direction: 'asc' },
    ]);

    expect(orderBy).toEqual([
      { author: { name: 'asc' } },
      { price: 'desc' },
      { title: 'asc' },
      { publisher: { name: 'asc' } },
      { genre: { name: 'desc' } },
      { isAvailable: 'asc' },
      { id: 'asc' },
    ]);
  });
});
