import { Link } from 'react-router-dom';
import { PencilIcon } from '../../../shared/ui/icons';
import { DeleteReferenceButton } from '../../references/ui/DeleteReferenceButton';
import { ActiveBooksPill, ReferenceName } from '../../references/ui/ReferenceCells';
import { formatBirthDate, type AuthorSummary } from '../domain/author.types';

export function AuthorRow({ author }: { author: AuthorSummary }) {
  const editLabel = `Editar ${author.name}`;

  return (
    <tr>
      <td>
        <ReferenceName name={author.name} />
      </td>
      <td className="table__nowrap">
        {author.birthDate ? (
          <time dateTime={author.birthDate}>{formatBirthDate(author.birthDate)}</time>
        ) : (
          <span className="muted" aria-label="Sin fecha">
            —
          </span>
        )}
      </td>
      <td>
        {author.biography ? (
          <p className="catalog-text">{author.biography}</p>
        ) : (
          <span className="muted" aria-label="Sin biografía">
            —
          </span>
        )}
      </td>
      <td className="table__center">
        <ActiveBooksPill count={author.activeBooks} />
      </td>
      <td className="table__actions">
        <div className="icon-group">
          <Link
            to={`/authors/${author.id}/edit`}
            className="icon-button icon-button--default"
            aria-label={editLabel}
            title={editLabel}
          >
            <PencilIcon />
          </Link>
          <DeleteReferenceButton kind="authors" reference={author} />
        </div>
      </td>
    </tr>
  );
}
