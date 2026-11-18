import type { Author } from '../domain/author';
import type { AuthorRepository } from '../domain/author.repository';
import { ReferenceNotFoundError } from '../domain/reference.errors';

export async function requireAuthor(authors: AuthorRepository, id: string): Promise<Author> {
  const found = await authors.findById(id);
  if (!found) throw new ReferenceNotFoundError('authors', id);
  return found;
}
