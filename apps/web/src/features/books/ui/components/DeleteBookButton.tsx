import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../shared/ui/Button';
import { ErrorBanner } from '../../../../shared/ui/ErrorBanner';
import { useDeleteBook } from '../../application/book-mutations';

/** Two-step inline confirmation instead of a blocking window.confirm(). */
export function DeleteBookButton({ bookId }: { bookId: string }) {
  const [isConfirming, setIsConfirming] = useState(false);
  const deleteBook = useDeleteBook();
  const navigate = useNavigate();

  if (!isConfirming) {
    return (
      <Button variant="danger" onClick={() => setIsConfirming(true)}>
        Eliminar
      </Button>
    );
  }

  const confirm = () =>
    deleteBook.mutate(bookId, { onSuccess: () => navigate('/books', { replace: true }) });

  return (
    <div className="confirm" role="group" aria-label="Confirmar eliminación">
      <span>¿Eliminar este libro?</span>
      <Button variant="danger" onClick={confirm} isLoading={deleteBook.isPending}>
        Sí, eliminar
      </Button>
      <Button
        variant="ghost"
        onClick={() => setIsConfirming(false)}
        disabled={deleteBook.isPending}
      >
        Cancelar
      </Button>
      {deleteBook.isError ? (
        <ErrorBanner error={deleteBook.error} title="No se pudo eliminar" />
      ) : null}
    </div>
  );
}
