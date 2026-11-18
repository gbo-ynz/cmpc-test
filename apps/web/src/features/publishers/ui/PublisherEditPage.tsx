import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../shared/ui/Spinner';
import { SuccessBanner } from '../../../shared/ui/SuccessBanner';
import { referenceErrorText } from '../../references/application/reference-hooks';
import { REFERENCE_COPY } from '../../references/domain/reference.types';
import { usePublisher, useUpdatePublisher } from '../application/publisher-hooks';
import { toPublisherFormValues } from '../domain/publisher-form.schema';
import type { PublisherInput } from '../domain/publisher.types';
import { PublisherForm } from './PublisherForm';

/** Same flow as editing an author: saving keeps the admin here with a confirmation. */
export default function PublisherEditPage() {
  const { id = '' } = useParams();
  const { data: publisher, error, isPending } = usePublisher(id);
  const update = useUpdatePublisher(id);

  if (isPending) return <Spinner label="Cargando editorial" />;
  if (error || !publisher) {
    return <ErrorBanner error={error} title="No se pudo cargar la editorial" />;
  }

  const save = async (input: PublisherInput) => {
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
        <Link to="/publishers">← Volver a editoriales</Link>
      </nav>
      <h1>Editar editorial</h1>
      {update.isSuccess ? (
        <SuccessBanner message="Los cambios se guardaron correctamente." />
      ) : null}
      {update.isError ? (
        <p role="alert" className="field__error">
          {referenceErrorText(update.error, REFERENCE_COPY.publishers.nameTaken)}
        </p>
      ) : null}
      <div className="card panel">
        <PublisherForm
          defaultValues={toPublisherFormValues(publisher)}
          submitLabel="Guardar cambios"
          onSubmit={save}
        />
      </div>
    </section>
  );
}
