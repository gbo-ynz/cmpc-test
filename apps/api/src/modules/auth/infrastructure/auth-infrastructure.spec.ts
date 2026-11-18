import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';
import { hashSync } from 'bcryptjs';
import type { User } from '../domain/user';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtTokenIssuer } from './jwt-token-issuer';
import { JwtStrategy } from './jwt.strategy';

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher();
  const hash = hashSync('Admin123!', 4);

  it('accepts the right password', async () => {
    await expect(hasher.verify('Admin123!', hash)).resolves.toBe(true);
  });

  it('hashes a password into something verify accepts, never storing it in plain text', async () => {
    const stored = await hasher.hash('Admin123!');

    expect(stored).not.toContain('Admin123!');
    await expect(hasher.verify('Admin123!', stored)).resolves.toBe(true);
    await expect(hasher.verify('other', stored)).resolves.toBe(false);
  });

  it('rejects a wrong password', async () => {
    await expect(hasher.verify('nope', hash)).resolves.toBe(false);
  });

  it('never authenticates when there is no stored hash', async () => {
    await expect(hasher.verify('timing-attack-mitigation', undefined)).resolves.toBe(false);
  });
});

describe('JwtTokenIssuer', () => {
  it('signs the identity claims', async () => {
    const jwt = { signAsync: jest.fn().mockResolvedValue('signed') };
    const issuer = new JwtTokenIssuer(jwt as unknown as JwtService);

    await expect(issuer.issue({ id: '1', email: 'a@b.cl', role: 'USER' })).resolves.toBe('signed');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: '1', email: 'a@b.cl', role: 'USER' });
  });
});

describe('JwtStrategy', () => {
  const config = { getOrThrow: () => 'x'.repeat(32) } as unknown as ConfigService;
  const stored: User = { id: '1', email: 'a@b.cl', name: 'A', role: 'USER', passwordHash: 'h' };
  const strategyWith = (user: User | null) => {
    const users = { findByEmail: jest.fn(), findById: jest.fn().mockResolvedValue(user) };
    return { strategy: new JwtStrategy(config, users), users };
  };

  it('resolves the user from the database, with its current role', async () => {
    const { strategy, users } = strategyWith(stored);

    await expect(strategy.validate({ sub: '1', email: 'a@b.cl', role: 'ADMIN' })).resolves.toEqual({
      id: '1',
      email: 'a@b.cl',
      role: 'USER',
    });
    expect(users.findById).toHaveBeenCalledWith('1');
  });

  it('rejects a valid token whose user no longer exists', async () => {
    const { strategy } = strategyWith(null);

    await expect(
      strategy.validate({ sub: 'gone', email: 'a@b.cl', role: 'ADMIN' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('JwtAuthGuard', () => {
  const context = { getHandler: () => null, getClass: () => null } as unknown as ExecutionContext;

  it('lets public routes through without a token', () => {
    const reflector = { getAllAndOverride: () => true } as unknown as Reflector;

    expect(new JwtAuthGuard(reflector).canActivate(context)).toBe(true);
  });

  it('delegates protected routes to passport', () => {
    const reflector = { getAllAndOverride: () => false } as unknown as Reflector;
    const parent = Object.getPrototypeOf(JwtAuthGuard.prototype) as { canActivate: () => boolean };
    const spy = jest.spyOn(parent, 'canActivate').mockReturnValue(false);

    expect(new JwtAuthGuard(reflector).canActivate(context)).toBe(false);
    expect(spy).toHaveBeenCalled();
  });
});
