import { Link } from 'react-router-dom';
import { PencilIcon } from '../../../shared/ui/icons';
import { DeleteReferenceButton } from '../../references/ui/DeleteReferenceButton';
import { ActiveBooksPill, ReferenceName } from '../../references/ui/ReferenceCells';
import type { GenreSummary } from '../domain/genre.types';

export function GenreRow({ genre }: { genre: GenreSummary }) {
  const editLabel = `Editar ${genre.name}`;

  return (
    <tr>
      <td>
        <ReferenceName name={genre.name} />
      </td>
      <td>
        {genre.description ? (
          <p className="catalog-text">{genre.description}</p>
        ) : (
          <span className="muted" aria-label="Sin descripción">
            —
          </span>
        )}
      </td>
      <td className="table__center">
        <ActiveBooksPill count={genre.activeBooks} />
      </td>
      <td className="table__actions">
        <div className="icon-group">
          <Link
            to={`/genres/${genre.id}/edit`}
            className="icon-button icon-button--default"
            aria-label={editLabel}
            title={editLabel}
          >
            <PencilIcon />
          </Link>
          <DeleteReferenceButton kind="genres" reference={genre} />
        </div>
      </td>
    </tr>
  );
}
