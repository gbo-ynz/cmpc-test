import type { Provider, Type } from '@nestjs/common';
import {
  GetAuthorUseCase,
  ListAuthorsPageUseCase,
  ListAuthorsUseCase,
} from './application/author-queries.use-case';
import { CreateAuthorUseCase } from './application/create-author.use-case';
import { ExportAuthorsCsvUseCase } from './application/export-catalog-csv.use-cases';
import { UpdateAuthorUseCase } from './application/update-author.use-case';
import { AuthorRepository } from './domain/author.repository';
import { PrismaAuthorRepository } from './infrastructure/persistence/prisma-author.repository';
import { AuthorsQueryController } from './presentation/authors-query.controller';
import { AuthorsController } from './presentation/authors.controller';

export const AUTHORS_CONTROLLERS: Type[] = [AuthorsQueryController, AuthorsController];

export const AUTHORS_PROVIDERS: Provider[] = [
  ListAuthorsUseCase,
  ListAuthorsPageUseCase,
  GetAuthorUseCase,
  CreateAuthorUseCase,
  UpdateAuthorUseCase,
  ExportAuthorsCsvUseCase,
  { provide: AuthorRepository, useClass: PrismaAuthorRepository },
];
