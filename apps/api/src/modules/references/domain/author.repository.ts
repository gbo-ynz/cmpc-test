import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { Author, AuthorDetails, AuthorSummary } from './author';

/**
 * Author-specific data (details). Name lookups, book counts and deletion stay in the shared
 * ReferenceRepository: they behave the same for the three catalogs.
 */
export abstract class AuthorRepository {
  /** Every author sorted by name, with details and number of active books. */
  abstract list(): Promise<AuthorSummary[]>;
  /** One page of the same list, sorted by name (stable: ties broken by id). */
  abstract listPage(request: PageRequest): Promise<Paginated<AuthorSummary>>;
  abstract findById(id: string): Promise<Author | null>;
  abstract create(name: string, details: AuthorDetails): Promise<Author>;
  /** Replaces name and details (the use case has already merged the changes). */
  abstract update(id: string, name: string, details: AuthorDetails): Promise<Author>;
}
