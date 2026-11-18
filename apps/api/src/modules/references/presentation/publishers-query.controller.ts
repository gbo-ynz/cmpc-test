import { Controller, Get, Param, ParseUUIDPipe, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../../shared/infrastructure/http/current-user.decorator';
import { Roles } from '../../../shared/infrastructure/http/roles.decorator';
import { ExportPublishersCsvUseCase } from '../application/export-catalog-csv.use-cases';
import {
  GetPublisherUseCase,
  ListPublishersPageUseCase,
  ListPublishersUseCase,
} from '../application/publisher-queries.use-case';
import { DEFAULT_PAGE_SIZE, PageQueryDto } from './page.query.dto';

/** Reading is open to every authenticated user (the book form lists publishers). */
@ApiTags('publishers')
@ApiBearerAuth()
@Controller('publishers')
export class PublishersQueryController {
  constructor(
    private readonly listPublishers: ListPublishersUseCase,
    private readonly listPublishersPage: ListPublishersPageUseCase,
    private readonly getPublisher: GetPublisherUseCase,
    private readonly exportPublishers: ExportPublishersCsvUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Publishers sorted by name; with page/limit it paginates on the server, else lists all',
  })
  list(@Query() { page, limit }: PageQueryDto) {
    if (page === undefined && limit === undefined) return this.listPublishers.execute();
    return this.listPublishersPage.execute({
      page: page ?? 1,
      limit: limit ?? DEFAULT_PAGE_SIZE,
    });
  }

  @Get('export')
  @Roles('ADMIN')
  @ApiProduces('text/csv')
  @ApiOperation({ summary: 'Export every publishers as CSV (admin only; declared before :id)' })
  async export(@CurrentUser() user: AuthenticatedUser): Promise<StreamableFile> {
    const csv = await this.exportPublishers.execute(user.id);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="editoriales.csv"',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'One publisher' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getPublisher.execute(id);
  }
}
