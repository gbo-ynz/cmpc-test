import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DEFAULT_PAGE_SIZE } from '../../../shared/infrastructure/http/page.query.dto';
import { AdminOnly } from '../../auth/index';
import { ListAuditLogsUseCase } from '../application/list-audit-logs.use-case';
import { ListAuditLogsQueryDto } from './audit-log.dto';

/** Read-only: the trail is written by the use cases themselves and can never be edited. */
@ApiTags('audit')
@ApiBearerAuth()
@AdminOnly()
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly listAuditLogs: ListAuditLogsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Audit trail newest first, paginated; filter by action, entity, user and date range',
  })
  list(@Query() { page = 1, limit = DEFAULT_PAGE_SIZE, ...filter }: ListAuditLogsQueryDto) {
    return this.listAuditLogs.execute({ page, limit }, filter);
  }
}
