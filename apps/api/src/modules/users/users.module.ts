import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreateUserUseCase } from './application/create-user.use-case';
import { DeactivateUserUseCase } from './application/deactivate-user.use-case';
import { UpdateUserUseCase } from './application/update-user.use-case';
import { GetUserUseCase, ListUsersPageUseCase } from './application/user-queries.use-case';
import { ManagedUserRepository } from './domain/managed-user.repository';
import { PrismaManagedUserRepository } from './infrastructure/persistence/prisma-managed-user.repository';
import { UsersQueryController } from './presentation/users-query.controller';
import { UsersController } from './presentation/users.controller';

/** Administration of the people who can sign in (RF-10). Sign-in itself lives in the auth module. */
@Module({
  imports: [AuthModule],
  controllers: [UsersQueryController, UsersController],
  providers: [
    ListUsersPageUseCase,
    GetUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeactivateUserUseCase,
    { provide: ManagedUserRepository, useClass: PrismaManagedUserRepository },
  ],
})
export class UsersModule {}
