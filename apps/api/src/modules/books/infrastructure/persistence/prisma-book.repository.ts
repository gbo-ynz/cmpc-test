import { Injectable } from '@nestjs/common';
import { asDuplicateError, hasActiveDuplicate } from './prisma-book-identity';
import { Paginated, paginate, toSkip } from '../../../../shared/domain/pagination';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Book } from '../../domain/book';
import type { BookCriteria, BookQuery } from '../../domain/book-criteria';
import { BookRepository } from '../../domain/book.repository';
import { buildBookOrderBy, buildBookWhere } from './book-query.builder';
import { BOOK_INCLUDE, toDomain, toPersistence } from './book.mapper';

const EXPORT_BATCH_SIZE = 500;

@Injectable()
export class PrismaBookRepository implements BookRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Book | null> {
    const record = await this.prisma.db.book.findFirst({
      where: { id, deletedAt: null },
      include: BOOK_INCLUDE,
    });
    return record ? toDomain(record) : null;
  }

  async findPage(criteria: BookCriteria): Promise<Paginated<Book>> {
    const where = buildBookWhere(criteria.filters);
    const orderBy = buildBookOrderBy(criteria.sort);
    const [total, records] = await Promise.all([
      this.prisma.db.book.count({ where }),
      this.prisma.db.book.findMany({
        where,
        orderBy,
        include: BOOK_INCLUDE,
        skip: toSkip(criteria),
        take: criteria.limit,
      }),
    ]);
    return paginate(records.map(toDomain), total, criteria);
  }

  async *streamAll(query: BookQuery): AsyncGenerator<readonly Book[]> {
    const where = buildBookWhere(query.filters);
    const orderBy = buildBookOrderBy(query.sort);
    for (let skip = 0; ; skip += EXPORT_BATCH_SIZE) {
      const records = await this.prisma.db.book.findMany({
        where,
        orderBy,
        include: BOOK_INCLUDE,
        skip,
        take: EXPORT_BATCH_SIZE,
      });
      if (records.length > 0) yield records.map(toDomain);
      if (records.length < EXPORT_BATCH_SIZE) return;
    }
  }

  hasDuplicate = (book: Book): Promise<boolean> => hasActiveDuplicate(this.prisma.db, book);

  async save(book: Book): Promise<Book> {
    const data = toPersistence(book);
    const write = { where: { id: book.id }, create: data, update: data, include: BOOK_INCLUDE };
    const record = await this.prisma.db.book.upsert(write).catch((error: unknown) => {
      throw asDuplicateError(error, book);
    });
    return toDomain(record);
  }
}
