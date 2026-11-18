import { Module } from '@nestjs/common';
import { CreateBookUseCase } from './application/create-book.use-case';
import { DeleteBookUseCase } from './application/delete-book.use-case';
import { ExportBooksCsvUseCase } from './application/export-books-csv.use-case';
import { GetBookUseCase } from './application/get-book.use-case';
import { ListBooksUseCase } from './application/list-books.use-case';
import { ImageStorage } from './application/ports/image-storage.port';
import { UpdateBookUseCase } from './application/update-book.use-case';
import { UploadBookImageUseCase } from './application/upload-book-image.use-case';
import { BookRepository } from './domain/book.repository';
import { PrismaBookRepository } from './infrastructure/persistence/prisma-book.repository';
import { LocalImageStorage } from './infrastructure/storage/local-image-storage';
import { BookImageController } from './presentation/book-image.controller';
import { BooksCommandController } from './presentation/books-command.controller';
import { BooksQueryController } from './presentation/books-query.controller';

@Module({
  controllers: [BooksQueryController, BooksCommandController, BookImageController],
  providers: [
    CreateBookUseCase,
    UpdateBookUseCase,
    DeleteBookUseCase,
    GetBookUseCase,
    ListBooksUseCase,
    ExportBooksCsvUseCase,
    UploadBookImageUseCase,
    // Ports bound to adapters: the only place that knows Prisma / disk are used.
    { provide: BookRepository, useClass: PrismaBookRepository },
    { provide: ImageStorage, useClass: LocalImageStorage },
  ],
})
export class BooksModule {}
