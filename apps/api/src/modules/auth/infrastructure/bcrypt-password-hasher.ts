import { Injectable } from '@nestjs/common';
import { compare, hashSync } from 'bcryptjs';
import { PasswordHasher } from '../application/ports/password-hasher.port';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  // Compared against when the user does not exist, to keep response time constant.
  private readonly dummyHash = hashSync('timing-attack-mitigation', BCRYPT_ROUNDS);

  async verify(plain: string, hash: string | undefined): Promise<boolean> {
    const matches = await compare(plain, hash ?? this.dummyHash);
    return hash !== undefined && matches;
  }
}
