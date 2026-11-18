import { Injectable } from '@nestjs/common';
import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { Genre, GenreSummary } from '../domain/genre';
import { GenreRepository } from '../domain/genre.repository';
import { requireGenre } from './require-genre';

/** Every genre with its description (book form selects). */
@Injectable()
export class ListGenresUseCase {
  constructor(private readonly genres: GenreRepository) {}

  execute(): Promise<GenreSummary[]> {
    return this.genres.list();
  }
}

/** One page of genres for the admin table (the book form keeps using the full list). */
@Injectable()
export class ListGenresPageUseCase {
  constructor(private readonly genres: GenreRepository) {}

  execute(request: PageRequest): Promise<Paginated<GenreSummary>> {
    return this.genres.listPage(request);
  }
}

/** One genre (edit screen); 404 when it does not exist. */
@Injectable()
export class GetGenreUseCase {
  constructor(private readonly genres: GenreRepository) {}

  execute(id: string): Promise<Genre> {
    return requireGenre(this.genres, id);
  }
}
