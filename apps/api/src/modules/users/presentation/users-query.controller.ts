import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../../auth/index';
import {
  DEFAULT_PAGE_SIZE,
  PageQueryDto,
} from '../../../shared/infrastructure/http/page.query.dto';
import { GetUserUseCase, ListUsersPageUseCase } from '../application/user-queries.use-case';

/** Administrators only. The password is never part of any response. */
@ApiTags('users')
@ApiBearerAuth()
@AdminOnly()
@Controller('users')
export class UsersQueryController {
  constructor(
    private readonly listUsers: ListUsersPageUseCase,
    private readonly getUser: GetUserUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Active users sorted by name, paginated on the server' })
  list(@Query() { page = 1, limit = DEFAULT_PAGE_SIZE }: PageQueryDto) {
    return this.listUsers.execute({ page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'One user' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getUser.execute(id);
  }
}
