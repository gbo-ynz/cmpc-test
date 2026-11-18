import { Module } from '@nestjs/common';
import { CreateReferenceUseCase } from './application/create-reference.use-case';
import { DeleteReferenceUseCase } from './application/delete-reference.use-case';
import { ListReferencesUseCase } from './application/list-references.use-case';
import { RenameReferenceUseCase } from './application/rename-reference.use-case';
import { ReferenceRepository } from './domain/reference.repository';
import { PrismaReferenceRepository } from './infrastructure/persistence/prisma-reference.repository';
import {
  AuthorsController,
  GenresController,
  PublishersController,
} from './presentation/reference-controllers';

/** Admin-managed catalogs: authors, publishers and genres share one implementation. */
@Module({
  controllers: [AuthorsController, PublishersController, GenresController],
  providers: [
    ListReferencesUseCase,
    CreateReferenceUseCase,
    RenameReferenceUseCase,
    DeleteReferenceUseCase,
    { provide: ReferenceRepository, useClass: PrismaReferenceRepository },
  ],
  // Books resolve the catalog ids they receive through this port.
  exports: [ReferenceRepository],
})
export class ReferencesModule {}
