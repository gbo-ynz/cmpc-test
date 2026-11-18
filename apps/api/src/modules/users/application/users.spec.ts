import {
  ACTOR_ID,
  FakeAuditLogger,
  FakePasswordHasher,
  FakeTransactionManager,
} from '../../../test-utils/fakes';
import { InMemoryManagedUserRepository } from '../../../test-utils/in-memory-managed-user.repository';
import {
  EmailTakenError,
  LastAdministratorError,
  SelfProtectionError,
  UserNotFoundError,
} from '../domain/user-admin.errors';
import { CreateUserUseCase } from './create-user.use-case';
import { DeactivateUserUseCase } from './deactivate-user.use-case';
import { UpdateUserUseCase } from './update-user.use-case';
import { GetUserUseCase, ListUsersPageUseCase } from './user-queries.use-case';

let users: InMemoryManagedUserRepository;
let audit: FakeAuditLogger;
let create: CreateUserUseCase;
let update: UpdateUserUseCase;
let deactivate: DeactivateUserUseCase;

beforeEach(() => {
  users = new InMemoryManagedUserRepository();
  audit = new FakeAuditLogger();
  const hasher = new FakePasswordHasher();
  const transactions = new FakeTransactionManager();
  create = new CreateUserUseCase(users, hasher, transactions, audit);
  update = new UpdateUserUseCase(users, hasher, transactions, audit);
  deactivate = new DeactivateUserUseCase(users, transactions, audit);
});

const NEW_USER = {
  name: '  Ana   Pérez ',
  email: ' Ana@CMPC.cl ',
  role: 'USER',
  password: 'secret123',
} as const;

describe('CreateUserUseCase', () => {
  it('stores a normalized, hashed user and never returns the hash', async () => {
    const created = await create.execute({ ...NEW_USER, actorId: ACTOR_ID });

    expect(created).toMatchObject({ name: 'Ana Pérez', email: 'ana@cmpc.cl', role: 'USER' });
    expect(created).not.toHaveProperty('passwordHash');
    expect(users.storedPasswordHash(created.id)).toBe('hash:secret123');
  });

  it('audits the creation without the password', async () => {
    const created = await create.execute({ ...NEW_USER, actorId: ACTOR_ID });

    expect(audit.entries).toEqual([
      {
        action: 'CREATE',
        entityType: 'User',
        entityId: created.id,
        actorId: ACTOR_ID,
        metadata: { email: 'ana@cmpc.cl', name: 'Ana Pérez', role: 'USER' },
      },
    ]);
  });

  it('rejects a repeated email ignoring case, even from a deactivated user', async () => {
    const old = users.seed({ email: 'ana@cmpc.cl', deleted: true });

    await expect(create.execute({ ...NEW_USER, actorId: ACTOR_ID })).rejects.toThrow(
      EmailTakenError,
    );
    expect(old.email).toBe('ana@cmpc.cl');
    expect(audit.entries).toHaveLength(0);
  });
});

describe('UpdateUserUseCase', () => {
  it('keeps the password when it is not sent and changes it when it is', async () => {
    const user = users.seed({ email: 'ana@cmpc.cl', passwordHash: 'hash:old' });

    await update.execute({ id: user.id, name: 'Ana María', actorId: ACTOR_ID });
    expect(users.storedPasswordHash(user.id)).toBe('hash:old');

    await update.execute({ id: user.id, password: 'newsecret1', actorId: ACTOR_ID });
    expect(users.storedPasswordHash(user.id)).toBe('hash:newsecret1');
  });

  it('lets a user keep its own email and audits the previous values', async () => {
    const user = users.seed({ email: 'ana@cmpc.cl', name: 'Ana' });

    const updated = await update.execute({
      id: user.id,
      email: 'ANA@cmpc.cl',
      role: 'ADMIN',
      actorId: ACTOR_ID,
    });

    expect(updated).toMatchObject({ email: 'ana@cmpc.cl', role: 'ADMIN' });
    expect(audit.entries[0]).toMatchObject({
      action: 'UPDATE',
      metadata: {
        previous: { name: 'Ana', email: 'ana@cmpc.cl', role: 'USER' },
        passwordChanged: false,
      },
    });
  });

  it('rejects an email that belongs to another user', async () => {
    users.seed({ email: 'luis@cmpc.cl' });
    const ana = users.seed({ email: 'ana@cmpc.cl' });

    await expect(
      update.execute({ id: ana.id, email: 'luis@cmpc.cl', actorId: ACTOR_ID }),
    ).rejects.toThrow(EmailTakenError);
  });

  it('does not let an administrator remove their own profile', async () => {
    const admin = users.seed({ email: 'root@cmpc.cl', role: 'ADMIN' });
    users.seed({ email: 'root2@cmpc.cl', role: 'ADMIN' });

    await expect(update.execute({ id: admin.id, role: 'USER', actorId: admin.id })).rejects.toThrow(
      SelfProtectionError,
    );
  });

  it('does not demote the last active administrator', async () => {
    const admin = users.seed({ email: 'root@cmpc.cl', role: 'ADMIN' });

    await expect(update.execute({ id: admin.id, role: 'USER', actorId: ACTOR_ID })).rejects.toThrow(
      LastAdministratorError,
    );
  });

  it('answers not found for an unknown or deactivated user', async () => {
    const gone = users.seed({ email: 'gone@cmpc.cl', deleted: true });

    await expect(update.execute({ id: gone.id, name: 'X', actorId: ACTOR_ID })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});

describe('DeactivateUserUseCase', () => {
  it('deactivates the user and audits it', async () => {
    const user = users.seed({ email: 'ana@cmpc.cl' });

    await deactivate.execute({ id: user.id, actorId: ACTOR_ID });

    expect(await users.findById(user.id)).toBeNull();
    expect(audit.entries[0]).toMatchObject({
      action: 'DELETE',
      entityType: 'User',
      entityId: user.id,
    });
  });

  it('does not let an administrator delete themselves', async () => {
    const admin = users.seed({ email: 'root@cmpc.cl', role: 'ADMIN' });
    users.seed({ email: 'root2@cmpc.cl', role: 'ADMIN' });

    await expect(deactivate.execute({ id: admin.id, actorId: admin.id })).rejects.toThrow(
      SelfProtectionError,
    );
  });

  it('always leaves one active administrator', async () => {
    const admin = users.seed({ email: 'root@cmpc.cl', role: 'ADMIN' });

    await expect(deactivate.execute({ id: admin.id, actorId: ACTOR_ID })).rejects.toThrow(
      LastAdministratorError,
    );
    expect(await users.findById(admin.id)).not.toBeNull();
  });

  it('allows deleting an administrator when another one remains', async () => {
    const admin = users.seed({ email: 'root@cmpc.cl', role: 'ADMIN' });
    users.seed({ email: 'root2@cmpc.cl', role: 'ADMIN' });

    await deactivate.execute({ id: admin.id, actorId: ACTOR_ID });

    expect(await users.countActiveAdmins()).toBe(1);
  });
});

describe('user queries', () => {
  it('lists active users sorted by name, one page at a time', async () => {
    ['Carla', 'Ana', 'Beto'].forEach((name) => users.seed({ name, email: `${name}@cmpc.cl` }));
    users.seed({ name: 'Zoe', email: 'zoe@cmpc.cl', deleted: true });

    const page = await new ListUsersPageUseCase(users).execute({ page: 2, limit: 2 });

    expect(page.items.map((user) => user.name)).toEqual(['Carla']);
    expect(page.meta).toEqual({ total: 3, page: 2, limit: 2, totalPages: 2 });
  });

  it('answers not found when the user is deactivated', async () => {
    const gone = users.seed({ email: 'gone@cmpc.cl', deleted: true });

    await expect(new GetUserUseCase(users).execute(gone.id)).rejects.toThrow(UserNotFoundError);
  });
});
