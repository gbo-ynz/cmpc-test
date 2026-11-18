import { FakeAuditLogger } from '../../../test-utils/fakes';
import { InvalidCredentialsError, User, UserRepository } from '../domain/user';
import { LoginUseCase } from './login.use-case';
import type { PasswordHasher } from './ports/password-hasher.port';
import type { TokenIssuer } from './ports/token-issuer.port';

const ADMIN: User = {
  id: 'user-1',
  email: 'admin@cmpc.cl',
  name: 'Admin',
  role: 'ADMIN',
  passwordHash: 'hashed',
};

function setup(user: User | null, isValidPassword: boolean) {
  const users: UserRepository = {
    findByEmail: jest.fn().mockResolvedValue(user),
    findById: jest.fn(),
  };
  const hasher: PasswordHasher = { verify: jest.fn().mockResolvedValue(isValidPassword) };
  const tokens: TokenIssuer = { issue: jest.fn().mockResolvedValue('jwt-token') };
  const audit = new FakeAuditLogger();
  return { useCase: new LoginUseCase(users, hasher, tokens, audit), users, hasher, audit };
}

describe('LoginUseCase', () => {
  it('returns a token and the public user profile on valid credentials', async () => {
    const { useCase, users, audit } = setup(ADMIN, true);

    const result = await useCase.execute({ email: '  ADMIN@cmpc.cl ', password: 'Admin123!' });

    expect(users.findByEmail).toHaveBeenCalledWith('admin@cmpc.cl');
    expect(result).toEqual({
      accessToken: 'jwt-token',
      user: { id: 'user-1', email: 'admin@cmpc.cl', name: 'Admin', role: 'ADMIN' },
    });
    expect(audit.entries).toEqual([
      expect.objectContaining({ action: 'LOGIN', actorId: 'user-1' }),
    ]);
  });

  it('rejects a wrong password', async () => {
    const { useCase } = setup(ADMIN, false);

    await expect(useCase.execute({ email: ADMIN.email, password: 'bad-pass' })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });

  it('still verifies a password when the user does not exist (timing safe)', async () => {
    const { useCase, hasher } = setup(null, true);

    await expect(
      useCase.execute({ email: 'ghost@cmpc.cl', password: 'whatever1' }),
    ).rejects.toThrow(InvalidCredentialsError);
    expect(hasher.verify).toHaveBeenCalledWith('whatever1', undefined);
  });
});
