import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../../../shared/api/api-error';
import { renderWithProviders } from '../../../../test/render';
import type { Book } from '../../domain/book.types';
import { booksApi } from '../../infrastructure/books.api';
import BookCreatePage from './BookCreatePage';
import BookDetailPage from './BookDetailPage';
import BookEditPage from './BookEditPage';
import { BooksListPage } from './BooksListPage';

vi.mock('../../infrastructure/books.api', () => ({
  booksApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    uploadImage: vi.fn(),
    exportCsv: vi.fn(),
    catalog: vi.fn(),
  },
}));

const api = vi.mocked(booksApi);
const BOOK: Book = {
  id: 'b1',
  title: 'Rayuela',
  author: 'Julio Cortázar',
  publisher: 'Sudamericana',
  genre: 'Novela',
  price: 16990,
  isAvailable: true,
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};
const PAGE = { items: [BOOK], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
const detailRoutes = { '/books/:id': <p>Detail page</p>, '/books': <p>Inventario</p> };

beforeEach(() => {
  api.catalog.mockResolvedValue({ authors: [], publishers: [], genres: [] });
});

describe('BooksListPage', () => {
  it('lists books, searches with debounce and sorts on the server', async () => {
    api.list.mockResolvedValue(PAGE);
    renderWithProviders(<BooksListPage />);

    expect(await screen.findByRole('link', { name: 'Rayuela' })).toBeInTheDocument();
    expect(screen.getByText('1 libro')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Buscar'), 'cort');
    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ search: 'cort' }) }),
      ),
    );
    expect(api.list).toHaveBeenCalledTimes(2); // one request for the whole word, not one per key

    await userEvent.click(screen.getByRole('button', { name: /precio/i }));
    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ sort: [{ field: 'price', direction: 'asc' }] }),
      ),
    );
  });

  it('shows API errors', async () => {
    api.list.mockRejectedValue(new ApiError('Database unavailable', 500, 'INTERNAL_ERROR'));
    renderWithProviders(<BooksListPage />);

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument();
  });
});

describe('BookDetailPage', () => {
  it('shows the book', async () => {
    api.get.mockResolvedValue(BOOK);
    renderWithProviders(<BookDetailPage />, { route: '/books/b1', path: '/books/:id' });

    expect(await screen.findByRole('heading', { name: 'Rayuela' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/books/b1/edit');
  });

  it('shows an error when the book cannot be loaded', async () => {
    api.get.mockRejectedValue(new ApiError('Book b1 was not found', 404, 'NOT_FOUND'));
    renderWithProviders(<BookDetailPage />, { route: '/books/b1', path: '/books/:id' });

    expect(await screen.findByText('Book b1 was not found')).toBeInTheDocument();
  });
});

describe('BookCreatePage', () => {
  async function submitNewBook() {
    await userEvent.type(screen.getByLabelText('Título'), 'Rayuela');
    await userEvent.type(screen.getByLabelText('Autor'), 'Cortázar');
    await userEvent.type(screen.getByLabelText('Editorial'), 'Sudamericana');
    await userEvent.type(screen.getByLabelText('Género'), 'Novela');
    await userEvent.type(screen.getByLabelText('Precio (CLP)'), '5');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear libro' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));
  }

  it('creates the book and opens its detail', async () => {
    api.create.mockResolvedValue(BOOK);
    renderWithProviders(<BookCreatePage />, {
      route: '/books/new',
      path: '/books/new',
      extraRoutes: detailRoutes,
    });

    await submitNewBook();

    expect(await screen.findByText('Detail page')).toBeInTheDocument();
  });

  it('keeps the user on the form when saving fails', async () => {
    api.create.mockRejectedValue(
      new ApiError('Validation failed', 400, 'BAD_REQUEST', ['title too long']),
    );
    renderWithProviders(<BookCreatePage />, { route: '/books/new', path: '/books/new' });

    await submitNewBook();

    expect(await screen.findByText('title too long')).toBeInTheDocument();
  });
});

describe('BookEditPage', () => {
  it('pre-fills the form, saves and stays on the edit page with a confirmation', async () => {
    api.get.mockResolvedValue(BOOK);
    api.update.mockResolvedValue({ ...BOOK, price: 20000, updatedAt: '2026-02-01T00:00:00.000Z' });
    renderWithProviders(<BookEditPage />, {
      route: '/books/b1/edit',
      path: '/books/:id/edit',
      extraRoutes: detailRoutes,
    });

    const price = await screen.findByLabelText('Precio (CLP)');
    expect(screen.getByLabelText('Título')).toHaveValue('Rayuela');
    await userEvent.clear(price);
    await userEvent.type(price, '20000');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Los cambios se guardaron correctamente.',
    );
    expect(api.update).toHaveBeenCalledWith('b1', expect.objectContaining({ price: 20000 }));
    expect(screen.queryByText('Detail page')).not.toBeInTheDocument();
    // The form now reflects the saved book: nothing left to save until the user edits again.
    expect(screen.getByLabelText('Precio (CLP)')).toHaveValue(20000);
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  });

  it('always offers a way back to the inventory', async () => {
    api.get.mockResolvedValue(BOOK);
    renderWithProviders(<BookEditPage />, { route: '/books/b1/edit', path: '/books/:id/edit' });

    expect(await screen.findByRole('link', { name: '← Volver al inventario' })).toHaveAttribute(
      'href',
      '/books',
    );
    expect(screen.queryByRole('link', { name: /Volver al libro/ })).not.toBeInTheDocument();
  });

  it('shows save errors', async () => {
    api.get.mockResolvedValue(BOOK);
    api.update.mockRejectedValue(new ApiError('Conflict', 409, 'CONFLICT'));
    renderWithProviders(<BookEditPage />, { route: '/books/b1/edit', path: '/books/:id/edit' });

    await userEvent.click(await screen.findByLabelText('Disponible para la venta'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Conflict')).toBeInTheDocument();
  });

  it('shows load errors', async () => {
    api.get.mockRejectedValue(new ApiError('Book b1 was not found', 404, 'NOT_FOUND'));
    renderWithProviders(<BookEditPage />, { route: '/books/b1/edit', path: '/books/:id/edit' });

    expect(await screen.findByText('Book b1 was not found')).toBeInTheDocument();
  });
});
