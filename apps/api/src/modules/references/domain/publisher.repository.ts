import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { Publisher, PublisherDetails, PublisherSummary } from './publisher';

/**
 * Publisher-specific data (country). Name lookups, book counts and deletion stay in the shared
 * ReferenceRepository: they behave the same for the three catalogs.
 */
export abstract class PublisherRepository {
  /** Every publisher sorted by name, with country and number of active books. */
  abstract list(): Promise<PublisherSummary[]>;
  /** One page of the same list, sorted by name (stable: ties broken by id). */
  abstract listPage(request: PageRequest): Promise<Paginated<PublisherSummary>>;
  abstract findById(id: string): Promise<Publisher | null>;
  abstract create(name: string, details: PublisherDetails): Promise<Publisher>;
  /** Replaces name and details (the use case has already merged the changes). */
  abstract update(id: string, name: string, details: PublisherDetails): Promise<Publisher>;
}
