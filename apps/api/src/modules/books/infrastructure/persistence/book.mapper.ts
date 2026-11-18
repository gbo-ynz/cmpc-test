import { Prisma } from '@prisma/client';
import { Book } from '../../domain/book';
import { Price } from '../../domain/price';

export const BOOK_INCLUDE = {
  author: true,
  publisher: true,
  genre: true,
} as const satisfies Prisma.BookInclude;

export type BookRecord = Prisma.BookGetPayload<{ include: typeof BOOK_INCLUDE }>;

// Reference entities are normalized tables; the aggregate addresses them by name.
const connectByName = (name: string) => ({
  connectOrCreate: { where: { name }, create: { name } },
});

export function toDomain(record: BookRecord): Book {
  return Book.restore({
    id: record.id,
    title: record.title,
    author: record.author.name,
    publisher: record.publisher.name,
    genre: record.genre.name,
    price: Price.of(record.price.toNumber()),
    isAvailable: record.isAvailable,
    imageUrl: record.imageUrl,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

export function toPersistence(book: Book): Prisma.BookCreateInput {
  const snapshot = book.snapshot();
  return {
    id: snapshot.id,
    title: snapshot.title,
    price: snapshot.price.toDecimalString(),
    isAvailable: snapshot.isAvailable,
    imageUrl: snapshot.imageUrl,
    deletedAt: snapshot.deletedAt,
    author: connectByName(snapshot.author),
    publisher: connectByName(snapshot.publisher),
    genre: connectByName(snapshot.genre),
  };
}
