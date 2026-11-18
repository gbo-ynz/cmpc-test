import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import type { UserRole } from '../../../shared/domain/authenticated-user';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_ROLES,
} from '../domain/managed-user';

/** Shape checks only; normalization and uniqueness live in the use cases. */
export class CreateUserDto {
  @ApiProperty({ example: 'Ana Pérez', maxLength: USER_NAME_MAX_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MaxLength(USER_NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({ example: 'ana@cmpc.cl', maxLength: EMAIL_MAX_LENGTH })
  @IsEmail()
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @ApiProperty({ enum: USER_ROLES })
  @IsIn(USER_ROLES)
  role: UserRole;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}

/** Every field optional: the password only changes when it is sent. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
