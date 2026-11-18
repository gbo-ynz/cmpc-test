import type { Publisher } from '../domain/publisher';
import type { PublisherRepository } from '../domain/publisher.repository';
import { ReferenceNotFoundError } from '../domain/reference.errors';

export async function requirePublisher(
  publishers: PublisherRepository,
  id: string,
): Promise<Publisher> {
  const found = await publishers.findById(id);
  if (!found) throw new ReferenceNotFoundError('publishers', id);
  return found;
}
