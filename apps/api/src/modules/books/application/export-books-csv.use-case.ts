import { Readable } from 'node:stream';
import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { BOOK_ENTITY_TYPE } from '../domain/book';
import type { BookQuery } from '../domain/book-criteria';
import { BookRepository } from '../domain/book.repository';
import { BOOK_CSV_HEADER, bookToCsvLine } from './book-csv.serializer';
import { toBookView } from './book-view';

// BOM so Excel opens UTF-8 accents (á, ñ) correctly.
const UTF8_BOM = '﻿';

export interface ExportBooksCommand {
  readonly query: BookQuery;
  readonly actorId: string;
}

/** Streams the CSV in batches: memory stays flat regardless of catalog size. */
@Injectable()
export class ExportBooksCsvUseCase {
  constructor(
    private readonly books: BookRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ query, actorId }: ExportBooksCommand): Promise<Readable> {
    await this.audit.record({
      action: 'EXPORT',
      entityType: BOOK_ENTITY_TYPE,
      actorId,
      metadata: { filters: query.filters },
    });
    return Readable.from(this.lines(query));
  }

  private async *lines(query: BookQuery): AsyncGenerator<string> {
    yield UTF8_BOM + BOOK_CSV_HEADER;
    for await (const batch of this.books.streamAll(query)) {
      yield batch.map((book) => bookToCsvLine(toBookView(book))).join('');
    }
  }
}
