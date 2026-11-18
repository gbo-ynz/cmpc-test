import { BadRequestException } from '@nestjs/common';
import {
  BOOK_SORT_FIELDS,
  BookCriteria,
  BookQuery,
  BookSort,
  BookSortField,
} from '../domain/book-criteria';
import type { BookFiltersQueryDto, ListBooksQueryDto } from './dto/list-books.query.dto';

const isSortField = (value: string): value is BookSortField =>
  (BOOK_SORT_FIELDS as readonly string[]).includes(value);

/** Parses `title:asc,price:desc` into a whitelisted sort specification. */
export function parseSort(raw: string | undefined): BookSort[] {
  if (!raw) return [];
  return raw.split(',').map((token) => {
    const [field, direction] = token.split(':');
    if (!isSortField(field) || (direction !== 'asc' && direction !== 'desc')) {
      throw new BadRequestException(`Invalid sort "${token}"`);
    }
    return { field, direction };
  });
}

export function toBookQuery(dto: BookFiltersQueryDto): BookQuery {
  const { search, genreId, publisherId, authorId, isAvailable } = dto;
  return {
    filters: { search, genreId, publisherId, authorId, isAvailable },
    sort: parseSort(dto.sort),
  };
}

export function toBookCriteria(dto: ListBooksQueryDto): BookCriteria {
  return { ...toBookQuery(dto), page: dto.page, limit: dto.limit };
}
