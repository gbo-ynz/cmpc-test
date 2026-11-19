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
import { CreatePublisherUseCase } from '../application/create-publisher.use-case';
import { DeleteReferenceUseCase } from '../application/delete-reference.use-case';
import { UpdatePublisherUseCase } from '../application/update-publisher.use-case';
import { CreatePublisherDto, UpdatePublisherDto } from './publisher.dto';

/** Admin-only writes; publishers carry a country besides the name. */
@ApiTags('publishers')
@ApiBearerAuth()
@Controller('publishers')
export class PublishersController {
  constructor(
    private readonly createPublisher: CreatePublisherUseCase,
    private readonly updatePublisher: UpdatePublisherUseCase,
    private readonly deleteReference: DeleteReferenceUseCase,
  ) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create (admin only; country is optional)' })
  create(@Body() dto: CreatePublisherDto, @CurrentUser() user: AuthenticatedUser) {
    return this.createPublisher.execute({ ...dto, actorId: user.id });
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Partial update (admin only; null clears the country)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublisherDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.updatePublisher.execute({ ...dto, id, actorId: user.id });
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (admin only; 409 if any book points to it)' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.deleteReference.execute({ kind: 'publishers', id, actorId: user.id });
  }
}
