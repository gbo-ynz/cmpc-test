import type { Page } from '../../../shared/api/envelope';
import type { Book, BookFilters, BookInput, BookListParams, Catalog, SortRule } from './book.types';

/** Port: the UI depends on this contract, not on axios. */
export interface BooksGateway {
  list(params: BookListParams): Promise<Page<Book>>;
  get(id: string): Promise<Book>;
  create(input: BookInput): Promise<Book>;
  update(id: string, input: Partial<BookInput>): Promise<Book>;
  remove(id: string): Promise<void>;
  uploadImage(id: string, file: File): Promise<Book>;
  exportCsv(filters: BookFilters, sort: readonly SortRule[]): Promise<Blob>;
  catalog(): Promise<Catalog>;
}
