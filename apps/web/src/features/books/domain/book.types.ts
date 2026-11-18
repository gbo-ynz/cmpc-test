export interface Book {
  readonly id: string;
  readonly title: string;
  readonly authorId: string;
  readonly author: string;
  readonly publisherId: string;
  readonly publisher: string;
  readonly genreId: string;
  readonly genre: string;
  readonly price: number;
  readonly stock: number;
  /** Derived by the API: stock > 0. */
  readonly isAvailable: boolean;
  readonly imageUrl: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type BookInput = Pick<
  Book,
  'title' | 'authorId' | 'publisherId' | 'genreId' | 'price' | 'stock'
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
  'title' | 'author' | 'publisher' | 'genre' | 'price' | 'stock' | 'createdAt';
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
