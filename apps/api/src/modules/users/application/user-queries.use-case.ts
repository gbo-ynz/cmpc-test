import { Injectable } from '@nestjs/common';
import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { ManagedUser } from '../domain/managed-user';
import { ManagedUserRepository } from '../domain/managed-user.repository';
import { requireUser } from './user-commands';

@Injectable()
export class ListUsersPageUseCase {
  constructor(private readonly users: ManagedUserRepository) {}

  execute(request: PageRequest): Promise<Paginated<ManagedUser>> {
    return this.users.listPage(request);
  }
}

/** One user (edit screen); 404 when it does not exist or was deactivated. */
@Injectable()
export class GetUserUseCase {
  constructor(private readonly users: ManagedUserRepository) {}

  execute(id: string): Promise<ManagedUser> {
    return requireUser(this.users, id);
  }
}
