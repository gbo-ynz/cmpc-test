import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ImageMimeType,
  ImageStorage,
  ImageUpload,
} from '../../application/ports/image-storage.port';

export const PUBLIC_UPLOADS_PATH = '/api/uploads';

const EXTENSIONS: Record<ImageMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** Disk adapter (Docker volume). Swap for an S3 adapter in cloud deployments. */
@Injectable()
export class LocalImageStorage implements ImageStorage {
  private readonly directory: string;

  constructor(config: ConfigService) {
    this.directory = resolve(config.get<string>('UPLOADS_DIR') ?? 'uploads');
  }

  async save(image: ImageUpload): Promise<string> {
    await mkdir(this.directory, { recursive: true });
    const fileName = `${randomUUID()}${EXTENSIONS[image.mimeType]}`;
    await writeFile(join(this.directory, fileName), image.buffer);
    return `${PUBLIC_UPLOADS_PATH}/${fileName}`;
  }

  async remove(url: string): Promise<void> {
    // basename() strips any "../" so a crafted URL cannot escape the uploads dir.
    await rm(join(this.directory, basename(url)), { force: true });
  }
}
