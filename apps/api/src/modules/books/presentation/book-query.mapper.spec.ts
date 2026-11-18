import { BadRequestException } from '@nestjs/common';
import { parseSort, toBookCriteria } from './book-query.mapper';
import { ListBooksQueryDto } from './dto/list-books.query.dto';

describe('parseSort', () => {
  it('returns an empty sort when nothing is requested', () => {
    expect(parseSort(undefined)).toEqual([]);
  });

  it('parses multiple whitelisted fields', () => {
    expect(parseSort('title:asc,price:desc')).toEqual([
      { field: 'title', direction: 'asc' },
      { field: 'price', direction: 'desc' },
    ]);
  });

  it.each(['password:asc', 'title:up', 'title'])('rejects %p', (raw) => {
    expect(() => parseSort(raw)).toThrow(BadRequestException);
  });
});

describe('toBookCriteria', () => {
  it('maps the HTTP query into domain criteria', () => {
    const dto = Object.assign(new ListBooksQueryDto(), {
      page: 2,
      limit: 20,
      search: 'borges',
      isAvailable: true,
      sort: 'author:asc',
    });

    expect(toBookCriteria(dto)).toEqual({
      page: 2,
      limit: 20,
      filters: {
        search: 'borges',
        genreId: undefined,
        publisherId: undefined,
        authorId: undefined,
        isAvailable: true,
      },
      sort: [{ field: 'author', direction: 'asc' }],
    });
  });
});
