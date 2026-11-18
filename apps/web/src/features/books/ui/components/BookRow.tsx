import { memo } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../../../shared/lib/format';
import type { Book } from '../../domain/book.types';
import { AvailabilityBadge } from './AvailabilityBadge';

const COVER_WIDTH = 40;
const COVER_HEIGHT = 56;

/** Memoized: re-renders only when its own book changes, not on every list update. */
export const BookRow = memo(function BookRow({ book }: { book: Book }) {
  return (
    <tr>
      <td className="table__cover">
        {book.imageUrl ? (
          <img
            src={book.imageUrl}
            alt=""
            loading="lazy"
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
          />
        ) : (
          <span className="cover-placeholder" aria-hidden="true" />
        )}
      </td>
      <td>
        <Link to={`/books/${book.id}`} className="table__title">
          {book.title}
        </Link>
      </td>
      <td>{book.author}</td>
      <td>{book.publisher}</td>
      <td>{book.genre}</td>
      <td className="table__number">{formatPrice(book.price)}</td>
      <td className="table__number">{book.stock}</td>
      <td>
        <AvailabilityBadge isAvailable={book.isAvailable} />
      </td>
      <td className="table__actions">
        <Link
          to={`/books/${book.id}/edit`}
          className="button button--ghost"
          aria-label={`Editar ${book.title}`}
        >
          Editar
        </Link>
      </td>
    </tr>
  );
});
