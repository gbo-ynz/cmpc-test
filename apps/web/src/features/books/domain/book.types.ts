import type { Page } from '../../../shared/api/envelope';

export interface Book {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly publisher: string;
  readonly genre: string;
  readonly price: number;
  readonly isAvailable: boolean;
  readonly imageUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type BookInput = Pick<
  Book,
  'title' | 'author' | 'publisher' | 'genre' | 'price' | 'isAvailable'
>;

export interface CatalogItem {
  readonly id: string;
  readonly name: string;
}

export interface Catalog {
  readonly authors: CatalogItem[];
  readonly publishers: CatalogItem[];
  readonly genres: CatalogItem[];
}

export type SortField =
  'title' | 'author' | 'publisher' | 'genre' | 'price' | 'isAvailable' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface SortRule {
  readonly field: SortField;
  readonly direction: SortDirection;
}

export type Availability = '' | 'true' | 'false';

export interface BookFilters {
  readonly search: string;
  readonly genreId: string;
  readonly publisherId: string;
  readonly authorId: string;
  readonly availability: Availability;
}

export interface BookListParams {
  readonly filters: BookFilters;
  readonly sort: readonly SortRule[];
  readonly page: number;
  readonly limit: number;
}

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
