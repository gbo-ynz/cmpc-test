import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
  PipeTransform,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  ALLOWED_IMAGE_TYPES,
  ImageMimeType,
  ImageUpload,
} from '../application/ports/image-storage.port';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

// The declared MIME type is client-controlled: verify the magic bytes too.
const SIGNATURES: Record<ImageMimeType, (buffer: Buffer) => boolean> = {
  'image/jpeg': (buffer) => buffer.subarray(0, 3).equals(JPEG_SIGNATURE),
  'image/png': (buffer) => buffer.subarray(0, 8).equals(PNG_SIGNATURE),
  'image/webp': (buffer) =>
    buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
};

const isAllowedType = (value: string): value is ImageMimeType =>
  (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);

@Injectable()
export class ImageFilePipe implements PipeTransform<Express.Multer.File | undefined, ImageUpload> {
  transform(file: Express.Multer.File | undefined): ImageUpload {
    if (!file) throw new BadRequestException('An image file is required (field "file")');
    if (file.size > MAX_IMAGE_BYTES) {
      throw new PayloadTooLargeException(`Image must be at most ${MAX_IMAGE_BYTES} bytes`);
    }
    if (!isAllowedType(file.mimetype)) {
      throw new UnsupportedMediaTypeException(`Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
    }
    if (!SIGNATURES[file.mimetype](file.buffer)) {
      throw new BadRequestException('File content does not match its declared type');
    }
    return { buffer: file.buffer, mimeType: file.mimetype };
  }
}
