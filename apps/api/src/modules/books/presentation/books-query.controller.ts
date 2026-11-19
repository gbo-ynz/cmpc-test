import { Controller, Get, Param, ParseUUIDPipe, Query, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import type { Paginated } from '../../../shared/domain/pagination';
import { CurrentUser } from '../../auth/index';
import type { BookView } from '../application/book-view';
import { ExportBooksCsvUseCase } from '../application/export-books-csv.use-case';
import { GetBookUseCase } from '../application/get-book.use-case';
import { ListBooksUseCase } from '../application/list-books.use-case';
import { toBookCriteria, toBookQuery } from './book-query.mapper';
import { BookFiltersQueryDto, ListBooksQueryDto } from './dto/list-books.query.dto';

/** Read side (CQS): queries never mutate state. */
@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
export class BooksQueryController {
  constructor(
    private readonly listBooks: ListBooksUseCase,
    private readonly getBook: GetBookUseCase,
    private readonly exportBooks: ExportBooksCsvUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List books: filters, multi-field sort, server-side pagination' })
  list(@Query() query: ListBooksQueryDto): Promise<Paginated<BookView>> {
    return this.listBooks.execute(toBookCriteria(query));
  }

  @Get('export')
  @ApiProduces('text/csv')
  @ApiOperation({ summary: 'Export the filtered books as CSV (streamed)' })
  async export(
    @Query() query: BookFiltersQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StreamableFile> {
    const stream = await this.exportBooks.execute({ query: toBookQuery(query), actorId: user.id });
    return new StreamableFile(stream, {
      type: 'text/csv; charset=utf-8',
      disposition: 'attachment; filename="libros.csv"',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Book detail' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BookView> {
    return this.getBook.execute(id);
  }
}
