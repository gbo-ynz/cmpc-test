import { Link, NavLink, Outlet } from 'react-router-dom';
import cmpcLogo from '../../assets/cmpc-logo.png';
import { Button } from './Button';

interface AppLayoutProps {
  userEmail: string;
  onLogout: () => void;
}

/** Presentational shell: knows nothing about how auth works. */
export function AppLayout({ userEmail, onLogout }: AppLayoutProps) {
  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/books" className="topbar__brand">
          <img src={cmpcLogo} alt="" className="topbar__logo" width={28} height={26} />
          CMPC Libros
        </Link>
        <nav className="topbar__nav" aria-label="Principal">
          <NavLink to="/books" end>
            Inventario
          </NavLink>
        </nav>
        <div className="topbar__user">
          <span className="muted">{userEmail}</span>
          <Button variant="ghost" onClick={onLogout}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
