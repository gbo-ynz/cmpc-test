import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { TokenIssuer } from '../application/ports/token-issuer.port';
import type { JwtPayload } from './jwt.strategy';

@Injectable()
export class JwtTokenIssuer implements TokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  issue(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    return this.jwt.signAsync(payload);
  }
}
