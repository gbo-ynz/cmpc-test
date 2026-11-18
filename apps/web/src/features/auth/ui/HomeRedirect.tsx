import { Navigate } from 'react-router-dom';
import { useAuth } from '../application/useAuth';

/** Where each profile lands: administrators on the dashboard, regular users on the inventory. */
export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user?.role === 'ADMIN' ? '/dashboard' : '/books'} replace />;
}
