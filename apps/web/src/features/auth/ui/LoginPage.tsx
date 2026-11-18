import { Navigate, useLocation } from 'react-router-dom';
import cmpcLogo from '../../../assets/cmpc-logo.png';
import { useAuth } from '../application/useAuth';
import { LoginForm } from './LoginForm';

const DEFAULT_REDIRECT = '/books';

export function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? DEFAULT_REDIRECT;

  if (user) return <Navigate to={from} replace />;

  return (
    <main className="auth">
      <section className="auth__card card">
        <img src={cmpcLogo} alt="" className="auth__logo" width={96} height={88} />
        <h1>CMPC Libros</h1>
        <p className="muted">Inicie sesión para gestionar el inventario de libros</p>
        <LoginForm redirectTo={from} />
      </section>
    </main>
  );
}
