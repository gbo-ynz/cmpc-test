import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../../shared/infrastructure/http/current-user.decorator';
import { Roles } from '../../../shared/infrastructure/http/roles.decorator';
import { CreateReferenceUseCase } from '../application/create-reference.use-case';
import { DeleteReferenceUseCase } from '../application/delete-reference.use-case';
import { ListReferencesUseCase } from '../application/list-references.use-case';
import { RenameReferenceUseCase } from '../application/rename-reference.use-case';
import type { Reference, ReferenceKind, ReferenceSummary } from '../domain/reference';
import { ReferenceNameDto } from './reference-name.dto';

/**
 * Routes shared by /authors, /publishers and /genres (subclasses only set the path and the kind).
 * Reading is open to every authenticated user (book forms need it); writing is admin only.
 */
@Injectable()
export abstract class ReferenceController {
  protected abstract readonly kind: ReferenceKind;

  constructor(
    private readonly listReferences: ListReferencesUseCase,
    private readonly createReference: CreateReferenceUseCase,
    private readonly renameReference: RenameReferenceUseCase,
    private readonly deleteReference: DeleteReferenceUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'All records sorted by name, with their number of active books' })
  list(): Promise<ReferenceSummary[]> {
    return this.listReferences.execute(this.kind);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create (admin only; names are unique ignoring case)' })
  create(@Body() dto: ReferenceNameDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createReference.execute({ kind: this.kind, name: dto.name, actorId: user.id });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rename (admin only)' })
  rename(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReferenceNameDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Reference> {
    return this.renameReference.execute({ kind: this.kind, id, name: dto.name, actorId: user.id });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (admin only; 409 if any book points to it)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.deleteReference.execute({ kind: this.kind, id, actorId: user.id });
  }
}
