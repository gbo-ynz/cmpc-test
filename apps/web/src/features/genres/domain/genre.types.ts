import type { Page } from '../../../shared/api/envelope';

export interface Genre {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
}

export interface GenreSummary extends Genre {
  readonly activeBooks: number;
}

export interface GenreInput {
  readonly name: string;
  readonly description: string | null;
}

export interface GenrePageParams {
  readonly page: number;
  readonly limit: number;
}

/** Port: the UI depends on this contract, not on axios. Deleting uses the shared catalog port. */
export interface GenresGateway {
  /** One server-side page (select options go through the shared catalog port). */
  listPage(params: GenrePageParams): Promise<Page<GenreSummary>>;
  get(id: string): Promise<Genre>;
  create(input: GenreInput): Promise<Genre>;
  update(id: string, input: GenreInput): Promise<Genre>;
}
