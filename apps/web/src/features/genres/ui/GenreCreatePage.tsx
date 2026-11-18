import { Link, useNavigate } from 'react-router-dom';
import { referenceErrorText } from '../../references/application/reference-hooks';
import { REFERENCE_COPY } from '../../references/domain/reference.types';
import { useCreateGenre } from '../application/genre-hooks';
import type { GenreInput } from '../domain/genre.types';
import { GenreForm } from './GenreForm';

/** Same flow as creating an author: once saved, the admin goes back to the list. */
export default function GenreCreatePage() {
  const create = useCreateGenre();
  const navigate = useNavigate();

  const save = async (input: GenreInput) => {
    try {
      await create.mutateAsync(input);
      navigate('/genres');
      return true;
    } catch {
      return false; // Rendered below from create.error.
    }
  };

  return (
    <section className="page page--narrow">
      <nav className="breadcrumbs">
        <Link to="/genres">← Volver a géneros</Link>
      </nav>
      <h1>Nuevo género</h1>
      {create.isError ? (
        <p role="alert" className="field__error">
          {referenceErrorText(create.error, REFERENCE_COPY.genres.nameTaken)}
        </p>
      ) : null}
      <div className="card panel">
        <GenreForm submitLabel="Agregar" onSubmit={save} />
      </div>
    </section>
  );
}
