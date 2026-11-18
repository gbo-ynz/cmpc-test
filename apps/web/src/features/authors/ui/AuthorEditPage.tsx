import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { SuccessBanner } from '../../../shared/ui/SuccessBanner';
import { referenceErrorText } from '../../references/application/reference-hooks';
import { REFERENCE_COPY } from '../../references/domain/reference.types';
import { useAuthor, useUpdateAuthor } from '../application/author-hooks';
import { toAuthorFormValues } from '../domain/author-form.schema';
import type { AuthorInput } from '../domain/author.types';
import { AuthorForm } from './AuthorForm';

/** Same flow as editing a book: saving keeps the admin here with a confirmation. */
export default function AuthorEditPage() {
  const { id = '' } = useParams();
  const { data: author, error, isPending } = useAuthor(id);
  const update = useUpdateAuthor(id);

  if (isPending) return <Spinner label="Cargando autor" />;
  if (error || !author) return <ErrorBanner error={error} title="No se pudo cargar el autor" />;

  const save = async (input: AuthorInput) => {
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
        <Link to="/authors">← Volver a autores</Link>
      </nav>
      <h1>Editar autor</h1>
      {update.isSuccess ? (
        <SuccessBanner message="Los cambios se guardaron correctamente." />
      ) : null}
      {update.isError ? (
        <p role="alert" className="field__error">
          {referenceErrorText(update.error, REFERENCE_COPY.authors.nameTaken)}
        </p>
      ) : null}
      <div className="card panel">
        <AuthorForm
          defaultValues={toAuthorFormValues(author)}
          submitLabel="Guardar cambios"
          onSubmit={save}
        />
      </div>
    </section>
  );
}
