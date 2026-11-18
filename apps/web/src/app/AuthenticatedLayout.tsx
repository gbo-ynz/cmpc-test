import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/application/useAuth';
import { AppLayout, type NavItem } from '../shared/ui/AppLayout';

const EVERYONE: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/books', label: 'Inventario' },
  { to: '/sales', label: 'Ventas' },
];
const ADMIN_ONLY: readonly NavItem[] = [
  { to: '/authors', label: 'Autores' },
  { to: '/publishers', label: 'Editoriales' },
  { to: '/genres', label: 'Géneros' },
  { to: '/users', label: 'Usuarios' },
];

/** Container: wires the auth feature into the presentational layout (menu depends on the role). */
export function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    logout();
    queryClient.clear(); // never leak cached data to the next user
    navigate('/login', { replace: true });
  }, [logout, queryClient, navigate]);

  const links = user?.role === 'ADMIN' ? [...EVERYONE, ...ADMIN_ONLY] : EVERYONE;
  return <AppLayout userEmail={user?.email ?? ''} links={links} onLogout={handleLogout} />;
}
