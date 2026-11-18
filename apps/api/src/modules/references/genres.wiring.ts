import type { Provider, Type } from '@nestjs/common';
import { CreateGenreUseCase } from './application/create-genre.use-case';
import {
  GetGenreUseCase,
  ListGenresPageUseCase,
  ListGenresUseCase,
} from './application/genre-queries.use-case';
import { ExportGenresCsvUseCase } from './application/export-catalog-csv.use-cases';
import { UpdateGenreUseCase } from './application/update-genre.use-case';
import { GenreRepository } from './domain/genre.repository';
import { PrismaGenreRepository } from './infrastructure/persistence/prisma-genre.repository';
import { GenresQueryController } from './presentation/genres-query.controller';
import { GenresController } from './presentation/genres.controller';

export const GENRES_CONTROLLERS: Type[] = [GenresQueryController, GenresController];

export const GENRES_PROVIDERS: Provider[] = [
  ListGenresUseCase,
  ListGenresPageUseCase,
  GetGenreUseCase,
  CreateGenreUseCase,
  UpdateGenreUseCase,
  ExportGenresCsvUseCase,
  { provide: GenreRepository, useClass: PrismaGenreRepository },
];
