import { Injectable } from '@nestjs/common';
import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { Publisher, PublisherSummary } from '../domain/publisher';
import { PublisherRepository } from '../domain/publisher.repository';
import { requirePublisher } from './require-publisher';

/** Every publisher with its country (book form selects). */
@Injectable()
export class ListPublishersUseCase {
  constructor(private readonly publishers: PublisherRepository) {}

  execute(): Promise<PublisherSummary[]> {
    return this.publishers.list();
  }
}

/** One page of publishers for the admin table (the book form keeps using the full list). */
@Injectable()
export class ListPublishersPageUseCase {
  constructor(private readonly publishers: PublisherRepository) {}

  execute(request: PageRequest): Promise<Paginated<PublisherSummary>> {
    return this.publishers.listPage(request);
  }
}

/** One publisher (edit screen); 404 when it does not exist. */
@Injectable()
export class GetPublisherUseCase {
  constructor(private readonly publishers: PublisherRepository) {}

  execute(id: string): Promise<Publisher> {
    return requirePublisher(this.publishers, id);
  }
}
