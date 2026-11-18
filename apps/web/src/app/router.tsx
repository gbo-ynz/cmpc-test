import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { HomeRedirect } from '../features/auth/ui/HomeRedirect';
import { LoginPage } from '../features/auth/ui/LoginPage';
import { RequireAuth } from '../features/auth/ui/RequireAuth';
import { RequireRole } from '../features/auth/ui/RequireRole';
import { BooksListPage } from '../features/books/ui/pages/BooksListPage';
import { DashboardPage } from '../features/dashboard/ui/DashboardPage';
import { SalesPage } from '../features/sales/ui/SalesPage';
import { NotFoundPage } from '../shared/ui/NotFoundPage';
import { RouteError } from '../shared/ui/RouteError';
import { adminRoutes } from './admin-routes';
import { AuthenticatedLayout } from './AuthenticatedLayout';
import { lazyPage } from './lazy-page';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AuthenticatedLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: 'dashboard', element: <DashboardPage /> },
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
          { path: 'sales', element: <SalesPage /> },
          {
            path: 'sales/new',
            lazy: lazyPage(() => import('../features/sales/ui/SaleCreatePage')),
          },
          {
            path: 'sales/:id',
            lazy: lazyPage(() => import('../features/sales/ui/SaleDetailPage')),
          },
          { element: <RequireRole role="ADMIN" />, children: adminRoutes },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

export const router = createBrowserRouter(routes);
