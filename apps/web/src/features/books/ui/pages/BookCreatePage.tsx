import { Link, useNavigate } from 'react-router-dom';
import { ErrorBanner } from '../../../../shared/ui/ErrorBanner';
import { useSaveBook } from '../../application/book-mutations';
import type { BookFormValues } from '../../domain/book-form.schema';
import { BookForm } from '../components/BookForm';

export default function BookCreatePage() {
  const saveBook = useSaveBook();
  const navigate = useNavigate();

  const handleSubmit = async (input: BookFormValues, image: File | null) => {
    try {
      const book = await saveBook.mutateAsync({ input, image });
      navigate(`/books/${book.id}`);
    } catch {
      // The error is rendered from saveBook.error below.
    }
  };

  return (
    <section className="page page--narrow">
      <nav className="breadcrumbs">
        <Link to="/books">← Volver al inventario</Link>
      </nav>
      <h1>Nuevo libro</h1>
      {saveBook.isError ? (
        <ErrorBanner error={saveBook.error} title="No se pudo guardar el libro" />
      ) : null}
      <BookForm submitLabel="Crear libro" onSubmit={handleSubmit} />
    </section>
  );
}
