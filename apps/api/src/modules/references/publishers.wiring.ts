import type { Provider, Type } from '@nestjs/common';
import { CreatePublisherUseCase } from './application/create-publisher.use-case';
import {
  GetPublisherUseCase,
  ListPublishersPageUseCase,
  ListPublishersUseCase,
} from './application/publisher-queries.use-case';
import { ExportPublishersCsvUseCase } from './application/export-catalog-csv.use-cases';
import { UpdatePublisherUseCase } from './application/update-publisher.use-case';
import { PublisherRepository } from './domain/publisher.repository';
import { PrismaPublisherRepository } from './infrastructure/persistence/prisma-publisher.repository';
import { PublishersQueryController } from './presentation/publishers-query.controller';
import { PublishersController } from './presentation/publishers.controller';

export const PUBLISHERS_CONTROLLERS: Type[] = [PublishersQueryController, PublishersController];

export const PUBLISHERS_PROVIDERS: Provider[] = [
  ListPublishersUseCase,
  ListPublishersPageUseCase,
  GetPublisherUseCase,
  CreatePublisherUseCase,
  UpdatePublisherUseCase,
  ExportPublishersCsvUseCase,
  { provide: PublisherRepository, useClass: PrismaPublisherRepository },
];
