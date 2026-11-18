import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { Genre, GenreDetails, GenreSummary } from './genre';

/**
 * Genre-specific data (description). Name lookups, book counts and deletion stay in the shared
 * ReferenceRepository: they behave the same for the three catalogs.
 */
export abstract class GenreRepository {
  /** Every genre sorted by name, with description and number of active books. */
  abstract list(): Promise<GenreSummary[]>;
  /** One page of the same list, sorted by name (stable: ties broken by id). */
  abstract listPage(request: PageRequest): Promise<Paginated<GenreSummary>>;
  abstract findById(id: string): Promise<Genre | null>;
  abstract create(name: string, details: GenreDetails): Promise<Genre>;
  /** Replaces name and details (the use case has already merged the changes). */
  abstract update(id: string, name: string, details: GenreDetails): Promise<Genre>;
}
