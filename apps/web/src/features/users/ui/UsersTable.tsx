import { useAuth } from '../../auth/application/useAuth';
import type { ManagedUser } from '../domain/user.types';
import { UserRow } from './UserRow';

export function UsersTable({ users }: { users: readonly ManagedUser[] }) {
  const { user: me } = useAuth();
  return (
    <div className="table-wrapper card">
      <table className="table catalog-table">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Correo electrónico</th>
            <th scope="col">Perfil</th>
            <th scope="col" className="table__actions">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} isCurrentUser={user.id === me?.id} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
