import { Injectable } from '@nestjs/common';
import {
  paginate,
  toSkip,
  type PageRequest,
  type Paginated,
} from '../../../../shared/domain/pagination';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { ManagedUser, NewUser, UserChanges } from '../../domain/managed-user';
import { ManagedUserRepository } from '../../domain/managed-user.repository';
import { ORDER_BY, SELECT, toManagedUser, toUpdateData } from './user.mapper';

const ACTIVE = { deletedAt: null } as const;

@Injectable()
export class PrismaManagedUserRepository implements ManagedUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPage(request: PageRequest): Promise<Paginated<ManagedUser>> {
    const [total, rows] = await Promise.all([
      this.prisma.db.user.count({ where: ACTIVE }),
      this.prisma.db.user.findMany({
        where: ACTIVE,
        select: SELECT,
        orderBy: ORDER_BY,
        skip: toSkip(request),
        take: request.limit,
      }),
    ]);
    return paginate(rows.map(toManagedUser), total, request);
  }

  async findById(id: string): Promise<ManagedUser | null> {
    const row = await this.prisma.db.user.findFirst({ where: { id, ...ACTIVE }, select: SELECT });
    return row ? toManagedUser(row) : null;
  }

  async findByEmail(email: string): Promise<ManagedUser | null> {
    const where = { email: { equals: email, mode: 'insensitive' } } as const;
    const row = await this.prisma.db.user.findFirst({ where, select: SELECT });
    return row ? toManagedUser(row) : null;
  }

  async create(user: NewUser): Promise<ManagedUser> {
    return toManagedUser(await this.prisma.db.user.create({ data: user, select: SELECT }));
  }

  async update(id: string, changes: UserChanges): Promise<ManagedUser> {
    const data = toUpdateData(changes);
    return toManagedUser(await this.prisma.db.user.update({ where: { id }, data, select: SELECT }));
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.db.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  countActiveAdmins(): Promise<number> {
    return this.prisma.db.user.count({ where: { role: 'ADMIN', ...ACTIVE } });
  }
}
