import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginUseCase } from './application/login.use-case';
import { PasswordHasher } from './application/ports/password-hasher.port';
import { TokenIssuer } from './application/ports/token-issuer.port';
import { UserRepository } from './domain/user';
import { BcryptPasswordHasher } from './infrastructure/bcrypt-password-hasher';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { JwtTokenIssuer } from './infrastructure/jwt-token-issuer';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { RolesGuard } from './infrastructure/roles.guard';
import { PrismaUserRepository } from './infrastructure/persistence/prisma-user.repository';
import { AuthController } from './presentation/auth.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS') },
      }),
    }),
  ],
  controllers: [AuthController],
  // The users administration hashes the passwords it stores.
  exports: [PasswordHasher],
  providers: [
    LoginUseCase,
    JwtStrategy,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    { provide: TokenIssuer, useClass: JwtTokenIssuer },
    // Order matters: authenticate first, then authorize by role.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
