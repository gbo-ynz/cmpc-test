import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ImageFilePipe, MAX_IMAGE_BYTES } from './image-file.pipe';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')]);

const file = (mimetype: string, buffer: Buffer, size = buffer.length) =>
  ({ mimetype, buffer, size }) as Express.Multer.File;

describe('ImageFilePipe', () => {
  const pipe = new ImageFilePipe();

  it.each([
    ['image/png', PNG],
    ['image/jpeg', JPEG],
    ['image/webp', WEBP],
  ])('accepts a real %s', (mimetype, buffer) => {
    expect(pipe.transform(file(mimetype, buffer))).toEqual({ buffer, mimeType: mimetype });
  });

  it('requires a file', () => {
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
  });

  it('rejects files over 2MB', () => {
    expect(() => pipe.transform(file('image/png', PNG, MAX_IMAGE_BYTES + 1))).toThrow(
      PayloadTooLargeException,
    );
  });

  it('rejects unsupported media types', () => {
    expect(() => pipe.transform(file('application/pdf', PNG))).toThrow(
      UnsupportedMediaTypeException,
    );
  });

  it('rejects files whose content does not match the declared type', () => {
    expect(() => pipe.transform(file('image/png', JPEG))).toThrow('does not match');
  });
});
