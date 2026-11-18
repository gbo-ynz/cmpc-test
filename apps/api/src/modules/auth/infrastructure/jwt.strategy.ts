import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser, UserRole } from '../../../shared/domain/authenticated-user';
import { UserRepository } from '../domain/user';

export interface JwtPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * A valid signature is not enough: the user must still exist. Reading the user (primary key
   * lookup) makes deletions and role changes effective immediately instead of at token expiry.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Session is no longer valid');
    return { id: user.id, email: user.email, role: user.role };
  }
}
