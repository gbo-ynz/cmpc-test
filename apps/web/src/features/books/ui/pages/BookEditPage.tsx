import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../../shared/ui/Spinner';
import { SuccessBanner } from '../../../../shared/ui/SuccessBanner';
import { useSaveBook } from '../../application/book-mutations';
import { useBook } from '../../application/book-queries';
import type { BookFormValues } from '../../domain/book-form.schema';
import { BookForm } from '../components/BookForm';

/** Saving keeps the user here: they can keep editing or go back to the inventory. */
export default function BookEditPage() {
  const { id = '' } = useParams();
  const { data: book, error, isPending } = useBook(id);
  const saveBook = useSaveBook();

  if (isPending) return <Spinner label="Cargando libro" />;
  if (error || !book) return <ErrorBanner error={error} title="No se pudo cargar el libro" />;

  const handleSubmit = async (input: BookFormValues, image: File | null) => {
    try {
      await saveBook.mutateAsync({ id, input, image });
    } catch {
      // The error is rendered from saveBook.error below.
    }
  };

  const { title, author, publisher, genre, price, isAvailable } = book;

  return (
    <section className="page page--narrow">
      <nav className="breadcrumbs">
        <Link to="/books">← Volver al inventario</Link>
      </nav>
      <h1>Editar libro</h1>
      {saveBook.isSuccess ? (
        <SuccessBanner message="Los cambios se guardaron correctamente." />
      ) : null}
      {saveBook.isError ? (
        <ErrorBanner error={saveBook.error} title="No se pudo guardar el libro" />
      ) : null}
      {/* A new updatedAt remounts the form with the saved values: clean state, current cover. */}
      <BookForm
        key={book.updatedAt}
        defaultValues={{ title, author, publisher, genre, price, isAvailable }}
        currentImageUrl={book.imageUrl}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
    </section>
  );
}
