import type { LoginUseCase } from '../application/login.use-case';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('delegates login to the use case', async () => {
    const result = {
      accessToken: 't',
      user: { id: '1', email: 'a@b.cl', name: 'A', role: 'ADMIN' },
    };
    const useCase = { execute: jest.fn().mockResolvedValue(result) };
    const controller = new AuthController(useCase as unknown as LoginUseCase);

    await expect(controller.login({ email: 'a@b.cl', password: 'Admin123!' })).resolves.toBe(
      result,
    );
    expect(useCase.execute).toHaveBeenCalledWith({ email: 'a@b.cl', password: 'Admin123!' });
  });

  it('returns the authenticated user on /me', () => {
    const controller = new AuthController({} as LoginUseCase);
    const user = { id: '1', email: 'a@b.cl', role: 'USER' as const };

    expect(controller.me(user)).toBe(user);
  });
});
