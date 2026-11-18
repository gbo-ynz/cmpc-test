import type { Reference, ReferenceKind, ReferenceSummary } from './reference';

/** Repository port shared by authors, publishers and genres. */
export abstract class ReferenceRepository {
  /** Every record of the kind, sorted by name, with its number of active books. */
  abstract list(kind: ReferenceKind): Promise<ReferenceSummary[]>;
  abstract findById(kind: ReferenceKind, id: string): Promise<Reference | null>;
  /** Case-insensitive lookup by exact name. */
  abstract findByName(kind: ReferenceKind, name: string): Promise<Reference | null>;
  abstract create(kind: ReferenceKind, name: string): Promise<Reference>;
  abstract rename(kind: ReferenceKind, id: string, name: string): Promise<Reference>;
  /** Books pointing to it, including soft-deleted ones. */
  abstract countBooks(kind: ReferenceKind, id: string): Promise<number>;
  abstract delete(kind: ReferenceKind, id: string): Promise<void>;
}
