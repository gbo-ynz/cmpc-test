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
import { CreateGenreUseCase } from '../application/create-genre.use-case';
import { DeleteReferenceUseCase } from '../application/delete-reference.use-case';
import { UpdateGenreUseCase } from '../application/update-genre.use-case';
import { CreateGenreDto, UpdateGenreDto } from './genre.dto';

/** Admin-only writes; genres carry a description besides the name. */
@ApiTags('genres')
@ApiBearerAuth()
@Controller('genres')
export class GenresController {
  constructor(
    private readonly createGenre: CreateGenreUseCase,
    private readonly updateGenre: UpdateGenreUseCase,
    private readonly deleteReference: DeleteReferenceUseCase,
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create (admin only; description is optional)' })
  create(@Body() dto: CreateGenreDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createGenre.execute({ ...dto, actorId: user.id });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Partial update (admin only; null clears the description)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGenreDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updateGenre.execute({ ...dto, id, actorId: user.id });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (admin only; 409 if any book points to it)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.deleteReference.execute({ kind: 'genres', id, actorId: user.id });
  }
}
