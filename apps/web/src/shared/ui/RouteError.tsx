import { Link, useRouteError } from 'react-router-dom';
import { ErrorBanner } from './ErrorBanner';

/** Last-resort boundary for render errors inside the routed tree. */
export function RouteError() {
  const error = useRouteError();

  return (
    <main className="layout__main">
      <ErrorBanner error={error} title="Ocurrió un error en esta página" />
      <Link to="/books" className="button button--secondary">
        Volver al inventario
      </Link>
    </main>
  );
}
