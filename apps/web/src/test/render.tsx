import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../features/auth/application/auth-context';

interface RenderOptions {
  route?: string;
  path?: string;
  auth?: Partial<AuthContextValue>;
  extraRoutes?: Record<string, ReactElement>;
}

export const fakeAuth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  user: { id: 'u1', email: 'admin@cmpc.cl', name: 'Admin', role: 'ADMIN' },
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  ...overrides,
});

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  const { route = '/', path = '/', auth, extraRoutes = {} } = options;
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={fakeAuth(auth)}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path={path} element={ui} />
            {Object.entries(extraRoutes).map(([extraPath, element]) => (
              <Route key={extraPath} path={extraPath} element={element} />
            ))}
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}
