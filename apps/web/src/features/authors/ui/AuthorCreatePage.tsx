import { Link, useNavigate } from 'react-router-dom';
import { referenceErrorText } from '../../references/application/reference-hooks';
import { REFERENCE_COPY } from '../../references/domain/reference.types';
import { useCreateAuthor } from '../application/author-hooks';
import type { AuthorInput } from '../domain/author.types';
import { AuthorForm } from './AuthorForm';

/** Same flow as creating a book: once saved, the admin goes back to the list. */
export default function AuthorCreatePage() {
  const create = useCreateAuthor();
  const navigate = useNavigate();

  const save = async (input: AuthorInput) => {
    try {
      await create.mutateAsync(input);
      navigate('/authors');
      return true;
    } catch {
      return false; // Rendered below from create.error.
    }
  };

  return (
    <section className="page page--narrow">
      <nav className="breadcrumbs">
        <Link to="/authors">← Volver a autores</Link>
      </nav>
      <h1>Nuevo autor</h1>
      {create.isError ? (
        <p role="alert" className="field__error">
          {referenceErrorText(create.error, REFERENCE_COPY.authors.nameTaken)}
        </p>
      ) : null}
      <div className="card panel">
        <AuthorForm submitLabel="Agregar" onSubmit={save} />
      </div>
    </section>
  );
}
