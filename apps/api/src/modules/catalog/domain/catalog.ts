export interface CatalogItem {
  readonly id: string;
  readonly name: string;
}

/**
 * Reference data used by the UI to build the book filters. Only items with at least one
 * active (not soft-deleted) book are listed, so no filter option leads to an empty result.
 */
export interface Catalog {
  readonly authors: readonly CatalogItem[];
  readonly publishers: readonly CatalogItem[];
  readonly genres: readonly CatalogItem[];
}

export abstract class CatalogRepository {
  abstract load(): Promise<Catalog>;
}
