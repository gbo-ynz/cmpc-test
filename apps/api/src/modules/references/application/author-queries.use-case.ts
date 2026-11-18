import { Injectable } from '@nestjs/common';
import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { Author, AuthorSummary } from '../domain/author';
import { AuthorRepository } from '../domain/author.repository';
import { requireAuthor } from './require-author';

/** Every author with details (admin screen and book form). */
@Injectable()
export class ListAuthorsUseCase {
  constructor(private readonly authors: AuthorRepository) {}

  execute(): Promise<AuthorSummary[]> {
    return this.authors.list();
  }
}

/** One page of authors for the admin table (the book form keeps using the full list). */
@Injectable()
export class ListAuthorsPageUseCase {
  constructor(private readonly authors: AuthorRepository) {}

  execute(request: PageRequest): Promise<Paginated<AuthorSummary>> {
    return this.authors.listPage(request);
  }
}

/** One author (edit screen); 404 when it does not exist. */
@Injectable()
export class GetAuthorUseCase {
  constructor(private readonly authors: AuthorRepository) {}

  execute(id: string): Promise<Author> {
    return requireAuthor(this.authors, id);
  }
}
