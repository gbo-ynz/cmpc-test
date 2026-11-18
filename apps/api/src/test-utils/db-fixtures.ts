import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { API_ROOT } from './postgres-container';

/** Names of the author, publisher and genre a test book belongs to (created on demand). */
export interface BookReferences {
  readonly author: string;
  readonly publisher: string;
  readonly genre: string;
}

const named = (name: string) => ({ connectOrCreate: { where: { name }, create: { name } } });

export const names = (items: ReadonlyArray<{ name: string }>): string[] =>
  items.map((item) => item.name);

export function addBook(prisma: PrismaClient, refs: BookReferences, deletedAt: Date | null = null) {
  return prisma.book.create({
    data: {
      title: `Libro de ${refs.author}`,
      price: 1000,
      deletedAt,
      author: named(refs.author),
      publisher: named(refs.publisher),
      genre: named(refs.genre),
    },
  });
}

export const INITIAL_MIGRATION = '20261117000000_init';

/** A copy of prisma/ holding only the first migration: the database as it was before later changes. */
export function initialMigrationOnly(): string {
  const dir = mkdtempSync(join(tmpdir(), 'cmpc-migrations-'));
  const from = (path: string) => join(API_ROOT, 'prisma', path);
  cpSync(from('schema.prisma'), join(dir, 'schema.prisma'));
  cpSync(from('migrations/migration_lock.toml'), join(dir, 'migrations/migration_lock.toml'));
  cpSync(from(`migrations/${INITIAL_MIGRATION}`), join(dir, `migrations/${INITIAL_MIGRATION}`), {
    recursive: true,
  });
  return join(dir, 'schema.prisma');
}

/** Rows written with the initial schema (raw SQL: the generated client only knows the current one). */
export const LEGACY_ROWS = [
  `INSERT INTO users (id, email, name, password_hash, role, updated_at)
     VALUES (gen_random_uuid(), 'editor@cmpc.cl', 'Editor', 'hash', 'EDITOR', now())`,
  `INSERT INTO authors (id, name) VALUES (gen_random_uuid(), 'Autor')`,
  `INSERT INTO publishers (id, name) VALUES (gen_random_uuid(), 'Editorial')`,
  `INSERT INTO genres (id, name) VALUES (gen_random_uuid(), 'Novela')`,
  `INSERT INTO books (id, title, price, is_available, author_id, publisher_id, genre_id, updated_at)
     SELECT gen_random_uuid(), title, 1000, available,
            (SELECT id FROM authors), (SELECT id FROM publishers), (SELECT id FROM genres), now()
     FROM (VALUES ('Disponible', true), ('Agotado', false)) AS legacy(title, available)`,
];

export async function seedCounts(prisma: PrismaClient) {
  return {
    books: await prisma.book.count(),
    users: await prisma.user.count(),
    genres: await prisma.genre.count(),
  };
}
