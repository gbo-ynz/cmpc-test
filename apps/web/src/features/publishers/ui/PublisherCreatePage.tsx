import { Link, useNavigate } from 'react-router-dom';
import { referenceErrorText } from '../../references/application/reference-hooks';
import { REFERENCE_COPY } from '../../references/domain/reference.types';
import { useCreatePublisher } from '../application/publisher-hooks';
import type { PublisherInput } from '../domain/publisher.types';
import { PublisherForm } from './PublisherForm';

/** Same flow as creating an author: once saved, the admin goes back to the list. */
export default function PublisherCreatePage() {
  const create = useCreatePublisher();
  const navigate = useNavigate();

  const save = async (input: PublisherInput) => {
    try {
      await create.mutateAsync(input);
      navigate('/publishers');
      return true;
    } catch {
      return false; // Rendered below from create.error.
    }
  };

  return (
    <section className="page page--narrow">
      <nav className="breadcrumbs">
        <Link to="/publishers">← Volver a editoriales</Link>
      </nav>
      <h1>Nueva editorial</h1>
      {create.isError ? (
        <p role="alert" className="field__error">
          {referenceErrorText(create.error, REFERENCE_COPY.publishers.nameTaken)}
        </p>
      ) : null}
      <div className="card panel">
        <PublisherForm submitLabel="Agregar" onSubmit={save} />
      </div>
    </section>
  );
}
