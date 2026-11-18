import { Link, useNavigate } from 'react-router-dom';
import { useCreateUser, userErrorText } from '../application/user-hooks';
import type { UserInput } from '../domain/user.types';
import { EMAIL_TAKEN } from './user-copy';
import { UserForm } from './UserForm';

/** Once saved, the administrator goes back to the list. */
export default function UserCreatePage() {
  const create = useCreateUser();
  const navigate = useNavigate();

  const save = async (input: UserInput) => {
    try {
      await create.mutateAsync(input);
      navigate('/users');
      return true;
    } catch {
      return false; // Rendered below from create.error.
    }
  };

  return (
    <section className="page page--narrow">
      <nav className="breadcrumbs">
        <Link to="/users">← Volver a usuarios</Link>
      </nav>
      <h1>Nuevo usuario</h1>
      {create.isError ? (
        <p role="alert" className="field__error">
          {userErrorText(create.error, EMAIL_TAKEN)}
        </p>
      ) : null}
      <div className="card panel">
        <UserForm mode="create" submitLabel="Agregar" onSubmit={save} />
      </div>
    </section>
  );
}
