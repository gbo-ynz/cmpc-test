import type { Reference, ReferenceKind } from '../../references/domain/reference';
import type { ReferenceRepository } from '../../references/domain/reference.repository';
import { type BookData, definedChanges } from '../domain/book-data';
import { InvalidBookError } from '../domain/book.errors';

/** What a driving adapter sends: catalog records are referenced by id. */
export interface BookInput {
  readonly title: string;
  readonly authorId: string;
  readonly publisherId: string;
  readonly genreId: string;
  readonly price: number;
  readonly stock: number;
}

async function resolve(
  references: ReferenceRepository,
  kind: ReferenceKind,
  id: string | undefined,
): Promise<Reference | undefined> {
  if (id === undefined) return undefined;
  const found = await references.findById(kind, id);
  if (!found) throw new InvalidBookError(`${kind} ${id} does not exist`);
  return found;
}

/** Turns catalog ids into the references the domain works with. An unknown id is a 400. */
export async function resolveBookInput(
  references: ReferenceRepository,
  input: Partial<BookInput>,
): Promise<Partial<BookData>> {
  const { authorId, publisherId, genreId, ...rest } = input;
  return definedChanges<BookData>({
    ...rest,
    author: await resolve(references, 'authors', authorId),
    publisher: await resolve(references, 'publishers', publisherId),
    genre: await resolve(references, 'genres', genreId),
  });
}
