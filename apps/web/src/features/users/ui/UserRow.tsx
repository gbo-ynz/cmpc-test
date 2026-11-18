import { Link } from 'react-router-dom';
import { PencilIcon } from '../../../shared/ui/icons';
import { ReferenceName } from '../../references/ui/ReferenceCells';
import { ROLE_LABELS, type ManagedUser } from '../domain/user.types';
import { DeactivateUserButton } from './DeactivateUserButton';

interface UserRowProps {
  user: ManagedUser;
  /** The signed-in administrator cannot delete their own account. */
  isCurrentUser: boolean;
}

export function UserRow({ user, isCurrentUser }: UserRowProps) {
  const editLabel = `Editar ${user.name}`;
  return (
    <tr>
      <td>
        <ReferenceName name={user.name} />
      </td>
      <td>{user.email}</td>
      <td>
        <span className={`badge ${user.role === 'ADMIN' ? 'badge--success' : 'badge--muted'}`}>
          {ROLE_LABELS[user.role]}
        </span>
      </td>
      <td className="table__actions">
        <div className="icon-group">
          <Link
            to={`/users/${user.id}/edit`}
            className="icon-button icon-button--default"
            aria-label={editLabel}
            title={editLabel}
          >
            <PencilIcon />
          </Link>
          {isCurrentUser ? null : <DeactivateUserButton user={user} />}
        </div>
      </td>
    </tr>
  );
}
