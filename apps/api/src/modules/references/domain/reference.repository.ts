import type { Reference, ReferenceKind } from './reference';

/** Repository port shared by authors, publishers and genres. */
export abstract class ReferenceRepository {
  abstract findById(kind: ReferenceKind, id: string): Promise<Reference | null>;
  /** Case-insensitive lookup by exact name. */
  abstract findByName(kind: ReferenceKind, name: string): Promise<Reference | null>;
  /** Books pointing to it, including soft-deleted ones. */
  abstract countBooks(kind: ReferenceKind, id: string): Promise<number>;
  abstract delete(kind: ReferenceKind, id: string): Promise<void>;
}
