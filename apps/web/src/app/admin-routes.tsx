import type { RouteObject } from 'react-router-dom';
import { AuthorsPage } from '../features/authors/ui/AuthorsPage';
import { GenresPage } from '../features/genres/ui/GenresPage';
import { PublishersPage } from '../features/publishers/ui/PublishersPage';
import { lazyPage } from './lazy-page';

/** Catalog administration: only reachable by administrators (see RequireRole in the router). */
export const adminRoutes: RouteObject[] = [
  { path: 'authors', element: <AuthorsPage /> },
  {
    path: 'authors/new',
    lazy: lazyPage(() => import('../features/authors/ui/AuthorCreatePage')),
  },
  {
    path: 'authors/:id/edit',
    lazy: lazyPage(() => import('../features/authors/ui/AuthorEditPage')),
  },
  { path: 'publishers', element: <PublishersPage /> },
  {
    path: 'publishers/new',
    lazy: lazyPage(() => import('../features/publishers/ui/PublisherCreatePage')),
  },
  {
    path: 'publishers/:id/edit',
    lazy: lazyPage(() => import('../features/publishers/ui/PublisherEditPage')),
  },
  { path: 'genres', element: <GenresPage /> },
  {
    path: 'genres/new',
    lazy: lazyPage(() => import('../features/genres/ui/GenreCreatePage')),
  },
  {
    path: 'genres/:id/edit',
    lazy: lazyPage(() => import('../features/genres/ui/GenreEditPage')),
  },
];
