import { Injectable } from '@nestjs/common';
import { Paginated, mapPage } from '../../../shared/domain/pagination';
import type { BookCriteria } from '../domain/book-criteria';
import { BookRepository } from '../domain/book.repository';
import { BookView, toBookView } from './book-view';

@Injectable()
export class ListBooksUseCase {
  constructor(private readonly books: BookRepository) {}

  async execute(criteria: BookCriteria): Promise<Paginated<BookView>> {
    return mapPage(await this.books.findPage(criteria), toBookView);
  }
}
