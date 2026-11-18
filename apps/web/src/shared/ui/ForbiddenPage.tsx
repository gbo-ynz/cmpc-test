import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <section className="page empty-state">
      <h1>No tiene permisos para ver esta página</h1>
      <p className="muted">Su perfil no tiene acceso a esta sección.</p>
      <Link to="/books" className="button button--primary">
        Ir al inventario
      </Link>
    </section>
  );
}
