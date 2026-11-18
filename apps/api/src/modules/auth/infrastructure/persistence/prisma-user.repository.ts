import { Injectable } from '@nestjs/common';
import type { User as UserRecord } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { User, UserRepository } from '../../domain/user';

const toUser = ({ id, email, name, role, passwordHash }: UserRecord): User => ({
  id,
  email,
  name,
  role,
  passwordHash,
});

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Deleted (deactivated) users are invisible: they cannot log in and their tokens stop working.
  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.db.user.findFirst({ where: { email, deletedAt: null } });
    return record ? toUser(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.db.user.findFirst({ where: { id, deletedAt: null } });
    return record ? toUser(record) : null;
  }
}
