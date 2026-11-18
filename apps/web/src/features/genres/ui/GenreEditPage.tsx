import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { SuccessBanner } from '../../../shared/ui/SuccessBanner';
import { referenceErrorText } from '../../references/application/reference-hooks';
import { REFERENCE_COPY } from '../../references/domain/reference.types';
import { useGenre, useUpdateGenre } from '../application/genre-hooks';
import { toGenreFormValues } from '../domain/genre-form.schema';
import type { GenreInput } from '../domain/genre.types';
import { GenreForm } from './GenreForm';

/** Same flow as editing an author: saving keeps the admin here with a confirmation. */
export default function GenreEditPage() {
  const { id = '' } = useParams();
  const { data: genre, error, isPending } = useGenre(id);
  const update = useUpdateGenre(id);

  if (isPending) return <Spinner label="Cargando género" />;
  if (error || !genre) {
    return <ErrorBanner error={error} title="No se pudo cargar el género" />;
  }

  const save = async (input: GenreInput) => {
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
        <Link to="/genres">← Volver a géneros</Link>
      </nav>
      <h1>Editar género</h1>
      {update.isSuccess ? (
        <SuccessBanner message="Los cambios se guardaron correctamente." />
      ) : null}
      {update.isError ? (
        <p role="alert" className="field__error">
          {referenceErrorText(update.error, REFERENCE_COPY.genres.nameTaken)}
        </p>
      ) : null}
      <div className="card panel">
        <GenreForm
          defaultValues={toGenreFormValues(genre)}
          submitLabel="Guardar cambios"
          onSubmit={save}
        />
      </div>
    </section>
  );
}
