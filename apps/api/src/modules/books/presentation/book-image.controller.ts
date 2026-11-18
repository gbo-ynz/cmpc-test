import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../../../shared/domain/authenticated-user';
import { CurrentUser } from '../../../shared/infrastructure/http/current-user.decorator';
import type { BookView } from '../application/book-view';
import type { ImageUpload } from '../application/ports/image-storage.port';
import { UploadBookImageUseCase } from '../application/upload-book-image.use-case';
import { ImageFilePipe, MAX_IMAGE_BYTES } from './image-file.pipe';

const FILE_SCHEMA = {
  schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
};

@ApiTags('books')
@ApiBearerAuth()
@Controller('books')
export class BookImageController {
  constructor(private readonly uploadImage: UploadBookImageUseCase) {}

  @Post(':id/image')
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_SCHEMA)
  @ApiOperation({ summary: 'Upload or replace the cover image (jpeg, png, webp; max 2MB)' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(ImageFilePipe) image: ImageUpload,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BookView> {
    return this.uploadImage.execute({ id, image, actorId: user.id });
  }
}
