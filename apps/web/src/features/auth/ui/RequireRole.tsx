import { Outlet } from 'react-router-dom';
import type { AuthUser } from '../../../shared/auth/session-storage';
import { ForbiddenPage } from '../../../shared/ui/ForbiddenPage';
import { useAuth } from '../application/useAuth';

/**
 * Route guard by role. The API enforces the same rule (403); this only avoids showing a screen
 * whose every request would fail.
 */
export function RequireRole({ role }: { role: AuthUser['role'] }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <ForbiddenPage />;
}
