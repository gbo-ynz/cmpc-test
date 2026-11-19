import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../auth/index';
import { Roles } from '../../auth/index';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { DeactivateUserUseCase } from '../application/deactivate-user.use-case';
import { UpdateUserUseCase } from '../application/update-user.use-case';
import { CreateUserDto, UpdateUserDto } from './user.dto';

/** Administrators only. The password is never part of any response. */
@ApiTags('users')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly deactivateUser: DeactivateUserUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create (409 if the email is already registered)' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.createUser.execute({ ...dto, actorId: actor.id });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update; the password only changes when sent' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.updateUser.execute({ ...dto, id, actorId: actor.id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate (409 for yourself or the last administrator)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    await this.deactivateUser.execute({ id, actorId: actor.id });
  }
}
