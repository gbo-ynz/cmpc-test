import type { Genre } from '../domain/genre';
import type { GenreRepository } from '../domain/genre.repository';
import { ReferenceNotFoundError } from '../domain/reference.errors';

export async function requireGenre(genres: GenreRepository, id: string): Promise<Genre> {
  const found = await genres.findById(id);
  if (!found) throw new ReferenceNotFoundError('genres', id);
  return found;
}
