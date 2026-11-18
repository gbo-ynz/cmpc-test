import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { SuccessBanner } from '../../../shared/ui/SuccessBanner';
import { useAuth } from '../../auth/application/useAuth';
import { useUpdateUser, useUser, userErrorText } from '../application/user-hooks';
import { toUserFormValues } from '../domain/user-form.schema';
import type { UserInput } from '../domain/user.types';
import { EMAIL_TAKEN } from './user-copy';
import { UserForm } from './UserForm';

/** Saving keeps the administrator here with a confirmation. */
export default function UserEditPage() {
  const { id = '' } = useParams();
  const { user: me } = useAuth();
  const { data: user, error, isPending } = useUser(id);
  const update = useUpdateUser(id);

  if (isPending) return <Spinner label="Cargando usuario" />;
  if (error || !user) return <ErrorBanner error={error} title="No se pudo cargar el usuario" />;

  const save = async (input: UserInput) => {
    try {
      await update.mutateAsync(input);
      return true;
    } catch {
      return false; // Rendered below from update.error.
    }
  };

  return (
    <section className="page page--narrow">
      <nav className="breadcrumbs">
        <Link to="/users">← Volver a usuarios</Link>
      </nav>
      <h1>Editar usuario</h1>
      {update.isSuccess ? (
        <SuccessBanner message="Los cambios se guardaron correctamente." />
      ) : null}
      {update.isError ? (
        <p role="alert" className="field__error">
          {userErrorText(update.error, EMAIL_TAKEN)}
        </p>
      ) : null}
      <div className="card panel">
        <UserForm
          mode="edit"
          defaultValues={toUserFormValues(user)}
          submitLabel="Guardar cambios"
          isRoleLocked={me?.id === user.id}
          onSubmit={save}
        />
      </div>
    </section>
  );
}
