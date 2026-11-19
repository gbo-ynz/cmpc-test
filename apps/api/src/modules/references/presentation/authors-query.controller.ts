import { Controller, Get, Param, ParseUUIDPipe, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../auth/index';
import { Roles } from '../../auth/index';
import { ExportAuthorsCsvUseCase } from '../application/export-catalog-csv.use-cases';
import {
  GetAuthorUseCase,
  ListAuthorsPageUseCase,
  ListAuthorsUseCase,
} from '../application/author-queries.use-case';
import {
  DEFAULT_PAGE_SIZE,
  PageQueryDto,
} from '../../../shared/infrastructure/http/page.query.dto';

/** Reading is open to every authenticated user (the book form lists authors). */
@ApiTags('authors')
@ApiBearerAuth()
@Controller('authors')
export class AuthorsQueryController {
  constructor(
    private readonly listAuthors: ListAuthorsUseCase,
    private readonly listAuthorsPage: ListAuthorsPageUseCase,
    private readonly getAuthor: GetAuthorUseCase,
    private readonly exportAuthors: ExportAuthorsCsvUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Authors sorted by name; with page/limit it paginates on the server, else lists all',
  })
  list(@Query() { page, limit }: PageQueryDto) {
    if (page === undefined && limit === undefined) return this.listAuthors.execute();
    return this.listAuthorsPage.execute({
      page: page ?? 1,
      limit: limit ?? DEFAULT_PAGE_SIZE,
    });
  }

  @Get('export')
  @Roles('ADMIN')
  @ApiProduces('text/csv')
  @ApiOperation({ summary: 'Export every authors as CSV (admin only; declared before :id)' })
  async export(@CurrentUser() user: AuthenticatedUser): Promise<StreamableFile> {
    const csv = await this.exportAuthors.execute(user.id);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="autores.csv"',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'One author' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getAuthor.execute(id);
  }
}
