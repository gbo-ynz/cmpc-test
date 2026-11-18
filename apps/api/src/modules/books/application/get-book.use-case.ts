import { Injectable } from '@nestjs/common';
import { BookRepository } from '../domain/book.repository';
import { BookView, toBookView } from './book-view';
import { requireBook } from './require-book';

@Injectable()
export class GetBookUseCase {
  constructor(private readonly books: BookRepository) {}

  async execute(id: string): Promise<BookView> {
    return toBookView(await requireBook(this.books, id));
  }
}
