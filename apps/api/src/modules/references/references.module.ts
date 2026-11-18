import { Module } from '@nestjs/common';
import { DeleteReferenceUseCase } from './application/delete-reference.use-case';
import { AUTHORS_CONTROLLERS, AUTHORS_PROVIDERS } from './authors.wiring';
import { ReferenceRepository } from './domain/reference.repository';
import { GENRES_CONTROLLERS, GENRES_PROVIDERS } from './genres.wiring';
import { PrismaReferenceRepository } from './infrastructure/persistence/prisma-reference.repository';
import { PUBLISHERS_CONTROLLERS, PUBLISHERS_PROVIDERS } from './publishers.wiring';

/**
 * Admin-managed catalogs. Authors (birth date, biography), publishers (country) and genres
 * (description) add their own details on top of the same name and deletion rules.
 */
@Module({
  controllers: [...AUTHORS_CONTROLLERS, ...PUBLISHERS_CONTROLLERS, ...GENRES_CONTROLLERS],
  providers: [
    DeleteReferenceUseCase,
    { provide: ReferenceRepository, useClass: PrismaReferenceRepository },
    ...AUTHORS_PROVIDERS,
    ...PUBLISHERS_PROVIDERS,
    ...GENRES_PROVIDERS,
  ],
  // Books resolve the catalog ids they receive through this port.
  exports: [ReferenceRepository],
})
export class ReferencesModule {}
