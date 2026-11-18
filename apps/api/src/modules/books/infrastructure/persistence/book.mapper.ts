import type { Prisma } from '@prisma/client';
import { Book } from '../../domain/book';
import { Price } from '../../domain/price';

export const BOOK_INCLUDE = {
  author: true,
  publisher: true,
  genre: true,
} as const satisfies Prisma.BookInclude;

export type BookRecord = Prisma.BookGetPayload<{ include: typeof BOOK_INCLUDE }>;

const reference = ({ id, name }: { id: string; name: string }) => ({ id, name });

export function toDomain(record: BookRecord): Book {
  return Book.restore({
    id: record.id,
    title: record.title,
    author: reference(record.author),
    publisher: reference(record.publisher),
    genre: reference(record.genre),
    price: Price.of(record.price.toNumber()),
    stock: record.stock,
    imageUrl: record.imageUrl,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

// Catalog records are managed on their own screens: a book only connects to existing ones.
export function toPersistence(book: Book): Prisma.BookCreateInput {
  const snapshot = book.snapshot();
  return {
    id: snapshot.id,
    title: snapshot.title,
    price: snapshot.price.toDecimalString(),
    stock: snapshot.stock,
    imageUrl: snapshot.imageUrl,
    deletedAt: snapshot.deletedAt,
    author: { connect: { id: snapshot.author.id } },
    publisher: { connect: { id: snapshot.publisher.id } },
    genre: { connect: { id: snapshot.genre.id } },
  };
}
