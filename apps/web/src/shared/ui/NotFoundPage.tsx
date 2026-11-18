import { Link } from 'react-router-dom';
import { EmptyState } from './EmptyState';

export function NotFoundPage() {
  return (
    <main className="layout__main">
      <EmptyState
        title="Página no encontrada"
        description="La página que busca no existe."
        action={
          <Link to="/books" className="button button--primary">
            Ir al inventario
          </Link>
        }
      />
    </main>
  );
}
