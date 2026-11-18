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
import type { BookView } from '../application/book-view';
import { CreateBookUseCase } from '../application/create-book.use-case';
import { DeleteBookUseCase } from '../application/delete-book.use-case';
import { UpdateBookUseCase } from '../application/update-book.use-case';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

/** Write side (CQS): every command is transactional and audited. */
@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
export class BooksCommandController {
  constructor(
    private readonly createBook: CreateBookUseCase,
    private readonly updateBook: UpdateBookUseCase,
    private readonly deleteBook: DeleteBookUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a book' })
  create(@Body() dto: CreateBookDto, @CurrentUser() user: AuthenticatedUser): Promise<BookView> {
    return this.createBook.execute({ data: { ...dto }, actorId: user.id });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a book' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BookView> {
    return this.updateBook.execute({ id, changes: { ...dto }, actorId: user.id });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a book' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.deleteBook.execute({ id, actorId: user.id });
  }
}
