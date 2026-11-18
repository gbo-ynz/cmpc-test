import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ConfigService } from '@nestjs/config';
import { LocalImageStorage } from './local-image-storage';

describe('LocalImageStorage', () => {
  let directory: string;
  let storage: LocalImageStorage;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'cmpc-uploads-'));
    storage = new LocalImageStorage({ get: () => directory } as unknown as ConfigService);
  });

  afterEach(() => rm(directory, { recursive: true, force: true }));

  it('writes the file with a random name and returns its public url', async () => {
    const url = await storage.save({ buffer: Buffer.from('img'), mimeType: 'image/webp' });

    expect(url).toMatch(/^\/api\/uploads\/[0-9a-f-]{36}\.webp$/);
    const fileName = url.split('/').pop() as string;
    await expect(readFile(join(directory, fileName), 'utf8')).resolves.toBe('img');
  });

  it('removes files and ignores missing ones', async () => {
    const url = await storage.save({ buffer: Buffer.from('img'), mimeType: 'image/png' });

    await storage.remove(url);
    await expect(storage.remove(url)).resolves.toBeUndefined();
    expect(existsSync(join(directory, url.split('/').pop() as string))).toBe(false);
  });

  it('cannot be tricked into deleting files outside the uploads dir', async () => {
    await expect(storage.remove('/api/uploads/../../package.json')).resolves.toBeUndefined();
    expect(existsSync(join(process.cwd(), 'package.json'))).toBe(true);
  });

  it('falls back to ./uploads when no directory is configured', () => {
    const fallback = new LocalImageStorage({ get: () => undefined } as unknown as ConfigService);

    expect(fallback).toBeInstanceOf(LocalImageStorage);
  });
});
