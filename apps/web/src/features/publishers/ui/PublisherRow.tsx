import { Link } from 'react-router-dom';
import { PencilIcon } from '../../../shared/ui/icons';
import { DeleteReferenceButton } from '../../references/ui/DeleteReferenceButton';
import { ActiveBooksPill, ReferenceName } from '../../references/ui/ReferenceCells';
import type { PublisherSummary } from '../domain/publisher.types';

export function PublisherRow({ publisher }: { publisher: PublisherSummary }) {
  const editLabel = `Editar ${publisher.name}`;

  return (
    <tr>
      <td>
        <ReferenceName name={publisher.name} />
      </td>
      <td>
        {publisher.country ?? (
          <span className="muted" aria-label="Sin país">
            —
          </span>
        )}
      </td>
      <td className="table__center">
        <ActiveBooksPill count={publisher.activeBooks} />
      </td>
      <td className="table__actions">
        <div className="icon-group">
          <Link
            to={`/publishers/${publisher.id}/edit`}
            className="icon-button icon-button--default"
            aria-label={editLabel}
            title={editLabel}
          >
            <PencilIcon />
          </Link>
          <DeleteReferenceButton kind="publishers" reference={publisher} />
        </div>
      </td>
    </tr>
  );
}
