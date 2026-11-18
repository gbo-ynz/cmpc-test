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
import { CurrentUser } from '../../../shared/infrastructure/http/current-user.decorator';
import { Roles } from '../../../shared/infrastructure/http/roles.decorator';
import { CreateAuthorUseCase } from '../application/create-author.use-case';
import { DeleteReferenceUseCase } from '../application/delete-reference.use-case';
import { UpdateAuthorUseCase } from '../application/update-author.use-case';
import { CreateAuthorDto, UpdateAuthorDto } from './author.dto';

/** Admin-only writes; authors carry details (birth date, biography) besides the name. */
@ApiTags('authors')
@ApiBearerAuth()
@Controller('authors')
export class AuthorsController {
  constructor(
    private readonly createAuthor: CreateAuthorUseCase,
    private readonly updateAuthor: UpdateAuthorUseCase,
    private readonly deleteReference: DeleteReferenceUseCase,
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create (admin only; birth date and biography are optional)' })
  create(@Body() dto: CreateAuthorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createAuthor.execute({ ...dto, actorId: user.id });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Partial update (admin only; null clears a detail)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAuthorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateAuthor.execute({ ...dto, id, actorId: user.id });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (admin only; 409 if any book points to it)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.deleteReference.execute({ kind: 'authors', id, actorId: user.id });
  }
}
