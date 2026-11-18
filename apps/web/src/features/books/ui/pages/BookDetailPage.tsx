import { Link, useParams } from 'react-router-dom';
import { ErrorBanner } from '../../../../shared/ui/ErrorBanner';
import { Spinner } from '../../../../shared/ui/Spinner';
import { useBook } from '../../application/book-queries';
import { BookDetailCard } from '../components/BookDetailCard';
import { DeleteBookButton } from '../components/DeleteBookButton';

export default function BookDetailPage() {
  const { id = '' } = useParams();
  const { data: book, error, isPending } = useBook(id);

  if (isPending) return <Spinner label="Cargando libro" />;
  if (error || !book) return <ErrorBanner error={error} title="No se pudo cargar el libro" />;

  return (
    <section className="page">
      <nav className="breadcrumbs">
        <Link to="/books">← Volver al inventario</Link>
      </nav>
      <BookDetailCard
        book={book}
        actions={
          <>
            <Link to={`/books/${book.id}/edit`} className="button button--primary">
              Editar
            </Link>
            <DeleteBookButton bookId={book.id} />
          </>
        }
      />
    </section>
  );
}
