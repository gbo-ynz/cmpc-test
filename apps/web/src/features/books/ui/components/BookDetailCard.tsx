import type { ReactNode } from 'react';
import { formatDate, formatPrice } from '../../../../shared/lib/format';
import type { Book } from '../../domain/book.types';
import { AvailabilityBadge } from './AvailabilityBadge';

interface BookDetailCardProps {
  book: Book;
  actions?: ReactNode;
}

export function BookDetailCard({ book, actions }: BookDetailCardProps) {
  const details: ReadonlyArray<[string, string]> = [
    ['Autor', book.author],
    ['Editorial', book.publisher],
    ['Género', book.genre],
    ['Precio', formatPrice(book.price)],
    ['Fecha de alta', formatDate(book.createdAt)],
    ['Última actualización', formatDate(book.updatedAt)],
  ];

  return (
    <article className="card book-detail">
      <div className="book-detail__cover">
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={`Portada de ${book.title}`} />
        ) : (
          <div
            className="cover-placeholder cover-placeholder--lg"
            role="img"
            aria-label="Sin imagen de portada"
          />
        )}
      </div>
      <div className="book-detail__body">
        <header className="book-detail__header">
          <h1>{book.title}</h1>
          <AvailabilityBadge isAvailable={book.isAvailable} />
        </header>
        <dl className="book-detail__list">
          {details.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {actions ? <div className="book-detail__actions">{actions}</div> : null}
      </div>
    </article>
  );
}
