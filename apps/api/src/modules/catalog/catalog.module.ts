import { Module } from '@nestjs/common';
import { GetCatalogUseCase } from './application/get-catalog.use-case';
import { CatalogRepository } from './domain/catalog';
import { PrismaCatalogRepository } from './infrastructure/persistence/prisma-catalog.repository';
import { CatalogController } from './presentation/catalog.controller';

@Module({
  controllers: [CatalogController],
  providers: [GetCatalogUseCase, { provide: CatalogRepository, useClass: PrismaCatalogRepository }],
})
export class CatalogModule {}
