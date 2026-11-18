import { randomUUID } from 'node:crypto';
import { BookData, NormalizedBookData, definedChanges, normalizeBookData } from './book-data';
import { BookNotFoundError } from './book.errors';

export const BOOK_ENTITY_TYPE = 'Book';

export interface BookProps extends NormalizedBookData {
  readonly id: string;
  readonly imageUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt: Date | null;
}

/** Aggregate root. Immutable: every behavior returns a new instance. */
export class Book {
  private constructor(private readonly props: Readonly<BookProps>) {}

  static create(data: BookData, now: Date = new Date()): Book {
    const base = { id: randomUUID(), imageUrl: null, deletedAt: null };
    return new Book({ ...normalizeBookData(data), ...base, createdAt: now, updatedAt: now });
  }

  static restore(props: BookProps): Book {
    return new Book({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  update(changes: Partial<BookData>, now: Date = new Date()): Book {
    this.assertActive();
    const merged = normalizeBookData({ ...this.toData(), ...definedChanges(changes) });
    return new Book({ ...this.props, ...merged, updatedAt: now });
  }

  attachImage(imageUrl: string, now: Date = new Date()): Book {
    this.assertActive();
    return new Book({ ...this.props, imageUrl, updatedAt: now });
  }

  softDelete(now: Date = new Date()): Book {
    this.assertActive();
    return new Book({ ...this.props, deletedAt: now, updatedAt: now });
  }

  snapshot(): Readonly<BookProps> {
    return this.props;
  }

  private toData(): BookData {
    const { title, author, publisher, genre, price, isAvailable } = this.props;
    return { title, author, publisher, genre, price: price.amount, isAvailable };
  }

  private assertActive(): void {
    if (this.isDeleted) throw new BookNotFoundError(this.id);
  }
}
