import { Controller, Get, Param, ParseUUIDPipe, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../../shared/infrastructure/http/current-user.decorator';
import { Roles } from '../../../shared/infrastructure/http/roles.decorator';
import { ExportGenresCsvUseCase } from '../application/export-catalog-csv.use-cases';
import {
  GetGenreUseCase,
  ListGenresPageUseCase,
  ListGenresUseCase,
} from '../application/genre-queries.use-case';
import { DEFAULT_PAGE_SIZE, PageQueryDto } from './page.query.dto';

/** Reading is open to every authenticated user (the book form lists genres). */
@ApiTags('genres')
@ApiBearerAuth()
@Controller('genres')
export class GenresQueryController {
  constructor(
    private readonly listGenres: ListGenresUseCase,
    private readonly listGenresPage: ListGenresPageUseCase,
    private readonly getGenre: GetGenreUseCase,
    private readonly exportGenres: ExportGenresCsvUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Genres sorted by name; with page/limit it paginates on the server, else lists all',
  })
  list(@Query() { page, limit }: PageQueryDto) {
    if (page === undefined && limit === undefined) return this.listGenres.execute();
    return this.listGenresPage.execute({
      page: page ?? 1,
      limit: limit ?? DEFAULT_PAGE_SIZE,
    });
  }

  @Get('export')
  @Roles('ADMIN')
  @ApiProduces('text/csv')
  @ApiOperation({ summary: 'Export every genres as CSV (admin only; declared before :id)' })
  async export(@CurrentUser() user: AuthenticatedUser): Promise<StreamableFile> {
    const csv = await this.exportGenres.execute(user.id);
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="generos.csv"',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'One genre' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.getGenre.execute(id);
  }
}
