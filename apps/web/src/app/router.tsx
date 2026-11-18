import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import { LoginPage } from '../features/auth/ui/LoginPage';
import { RequireAuth } from '../features/auth/ui/RequireAuth';
import { RequireRole } from '../features/auth/ui/RequireRole';
import { BooksListPage } from '../features/books/ui/pages/BooksListPage';
import { ReferencesPage } from '../features/references/ui/ReferencesPage';
import { NotFoundPage } from '../shared/ui/NotFoundPage';
import { RouteError } from '../shared/ui/RouteError';
import { AuthenticatedLayout } from './AuthenticatedLayout';

// Secondary pages are code-split: the list (landing page) ships in the main chunk.
const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) => async () => ({
  Component: (await load()).default,
});

const adminRoutes: RouteObject[] = [
  { path: 'authors', element: <ReferencesPage kind="authors" /> },
  { path: 'publishers', element: <ReferencesPage kind="publishers" /> },
  { path: 'genres', element: <ReferencesPage kind="genres" /> },
];

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          { index: true, element: <Navigate to="/books" replace /> },
          { path: 'books', element: <BooksListPage /> },
          {
            path: 'books/new',
            lazy: lazyPage(() => import('../features/books/ui/pages/BookCreatePage')),
          },
          {
            path: 'books/:id',
            lazy: lazyPage(() => import('../features/books/ui/pages/BookDetailPage')),
          },
          {
            path: 'books/:id/edit',
            lazy: lazyPage(() => import('../features/books/ui/pages/BookEditPage')),
          },
          { element: <RequireRole role="ADMIN" />, children: adminRoutes },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
