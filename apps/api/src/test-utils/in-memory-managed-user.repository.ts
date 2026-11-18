import { randomUUID } from 'node:crypto';
import type { UserRole } from '../shared/domain/authenticated-user';
import { paginate, toSkip, type PageRequest, type Paginated } from '../shared/domain/pagination';
import type { ManagedUser, NewUser, UserChanges } from '../modules/users/domain/managed-user';
import { ManagedUserRepository } from '../modules/users/domain/managed-user.repository';

interface Stored extends ManagedUser {
  passwordHash: string;
  deleted: boolean;
}

/** Same contract as the Prisma adapter: sorted active list, case-insensitive email, soft deletion. */
export class InMemoryManagedUserRepository extends ManagedUserRepository {
  private readonly rows = new Map<string, Stored>();

  seed(overrides: Partial<Stored> & { email: string; role?: UserRole }): ManagedUser {
    const row: Stored = {
      id: randomUUID(),
      name: 'Seeded user',
      role: 'USER',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      passwordHash: 'hash:seeded',
      deleted: false,
      ...overrides,
    };
    this.rows.set(row.id, row);
    return this.view(row);
  }

  async listPage(request: PageRequest): Promise<Paginated<ManagedUser>> {
    const active = this.active().sort((a, b) => a.name.localeCompare(b.name));
    const start = toSkip(request);
    return paginate(
      active.slice(start, start + request.limit).map(this.view),
      active.length,
      request,
    );
  }

  async findById(id: string): Promise<ManagedUser | null> {
    const row = this.rows.get(id);
    return row && !row.deleted ? this.view(row) : null;
  }

  async findByEmail(email: string): Promise<ManagedUser | null> {
    const row = [...this.rows.values()].find((r) => r.email.toLowerCase() === email.toLowerCase());
    return row ? this.view(row) : null;
  }

  async create(user: NewUser): Promise<ManagedUser> {
    return this.seed(user);
  }

  async update(id: string, { passwordHash, ...fields }: UserChanges): Promise<ManagedUser> {
    const current = this.rows.get(id)!;
    const next = { ...current, ...fields, ...(passwordHash ? { passwordHash } : {}) };
    this.rows.set(id, next);
    return this.view(next);
  }

  async deactivate(id: string): Promise<void> {
    this.rows.set(id, { ...this.rows.get(id)!, deleted: true });
  }

  async countActiveAdmins(): Promise<number> {
    return this.active().filter((row) => row.role === 'ADMIN').length;
  }

  /** What a test needs to assert on, but the port never exposes. */
  storedPasswordHash(id: string): string | undefined {
    return this.rows.get(id)?.passwordHash;
  }

  private active(): Stored[] {
    return [...this.rows.values()].filter((row) => !row.deleted);
  }

  private view = ({ id, email, name, role, createdAt }: Stored): ManagedUser => ({
    id,
    email,
    name,
    role,
    createdAt,
  });
}
