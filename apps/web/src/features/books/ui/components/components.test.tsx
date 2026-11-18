import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../../../shared/api/api-error';
import { renderWithProviders } from '../../../../test/render';
import type { Book } from '../../domain/book.types';
import { booksApi } from '../../infrastructure/books.api';
import { BookDetailCard } from './BookDetailCard';
import { BookFiltersBar } from './BookFiltersBar';
import { BooksTable } from './BooksTable';
import { DeleteBookButton } from './DeleteBookButton';
import { ExportCsvButton } from './ExportCsvButton';
import { ImagePicker } from './ImagePicker';

vi.mock('../../infrastructure/books.api', () => ({
  booksApi: { catalog: vi.fn(), remove: vi.fn(), exportCsv: vi.fn() },
}));
vi.mock('../../../../shared/lib/download', () => ({
  downloadBlob: vi.fn(),
  datedFileName: () => 'books.csv',
}));

const api = vi.mocked(booksApi);
const FILTERS = {
  search: '',
  genreId: '',
  publisherId: '',
  authorId: '',
  availability: '' as const,
};
const BOOK: Book = {
  id: 'b1',
  title: 'Rayuela',
  author: 'Julio Cortázar',
  publisher: 'Sudamericana',
  genre: 'Novela',
  price: 16990,
  isAvailable: false,
  imageUrl: '/api/uploads/b1.png',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const renderTable = (props: Partial<Parameters<typeof BooksTable>[0]> = {}) =>
  render(
    <MemoryRouter>
      <BooksTable
        books={[BOOK]}
        sort={[]}
        onSort={vi.fn()}
        isLoading={false}
        isRefreshing={false}
        {...props}
      />
    </MemoryRouter>,
  );

describe('BooksTable', () => {
  it('renders one row per book with link, price and status', () => {
    renderTable();

    expect(screen.getByRole('link', { name: 'Rayuela' })).toHaveAttribute('href', '/books/b1');
    expect(screen.getByText(/16\.990/)).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
  });

  it('shows loading and empty states', () => {
    const { rerender } = renderTable({ isLoading: true });
    expect(screen.getByRole('status', { name: 'Cargando libros' })).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <BooksTable books={[]} sort={[]} onSort={vi.fn()} isLoading={false} isRefreshing={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText('No se encontraron libros')).toBeInTheDocument();
  });

  it('exposes sort state and priority on headers', async () => {
    const onSort = vi.fn();
    renderTable({
      onSort,
      sort: [
        { field: 'price', direction: 'desc' },
        { field: 'title', direction: 'asc' },
      ],
    });

    await userEvent.click(screen.getByRole('button', { name: /autor/i }));

    expect(onSort).toHaveBeenCalledWith('author');
    expect(screen.getByRole('columnheader', { name: /precio/i })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    expect(screen.getByRole('columnheader', { name: /título/i })).toHaveTextContent('▲2');
  });
});

describe('BookFiltersBar', () => {
  it('fills selects from the catalog and reports changes', async () => {
    api.catalog.mockResolvedValue({
      authors: [],
      publishers: [],
      genres: [{ id: 'g1', name: 'Novela' }],
    });
    const onChange = vi.fn();
    const onReset = vi.fn();
    renderWithProviders(<BookFiltersBar filters={FILTERS} onChange={onChange} onReset={onReset} />);

    await screen.findByRole('option', { name: 'Novela' });
    await userEvent.selectOptions(screen.getByLabelText('Género'), 'g1');
    await userEvent.selectOptions(screen.getByLabelText('Disponibilidad'), 'false');
    await userEvent.type(screen.getByLabelText('Buscar'), 'b');
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(onChange).toHaveBeenCalledWith('genreId', 'g1');
    expect(onChange).toHaveBeenCalledWith('availability', 'false');
    expect(onChange).toHaveBeenCalledWith('search', 'b');
    expect(onReset).toHaveBeenCalled();
  });
});

describe('BookDetailCard', () => {
  it('shows every book attribute and the cover', () => {
    render(<BookDetailCard book={BOOK} />);

    expect(screen.getByRole('heading', { name: 'Rayuela' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Portada de Rayuela' })).toBeInTheDocument();
    expect(screen.getByText('Sudamericana')).toBeInTheDocument();
  });

  it('shows a placeholder without cover', () => {
    render(<BookDetailCard book={{ ...BOOK, imageUrl: null }} />);

    expect(screen.getByRole('img', { name: 'Sin imagen de portada' })).toBeInTheDocument();
  });
});

describe('DeleteBookButton', () => {
  it('asks for confirmation, can be cancelled, then deletes', async () => {
    api.remove.mockResolvedValue(undefined);
    renderWithProviders(<DeleteBookButton bookId="b1" />, {
      extraRoutes: { '/books': <p>Inventario</p> },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByText('Inventario')).toBeInTheDocument();
    expect(api.remove).toHaveBeenCalledWith('b1');
  });

  it('shows the error when deletion fails', async () => {
    api.remove.mockRejectedValue(new ApiError('Book b1 was not found', 404, 'NOT_FOUND'));
    renderWithProviders(<DeleteBookButton bookId="b1" />);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByText('Book b1 was not found')).toBeInTheDocument();
  });
});

describe('ExportCsvButton', () => {
  it('exports with the current filters and surfaces failures', async () => {
    api.exportCsv.mockRejectedValueOnce(new ApiError('Export failed', 500, 'INTERNAL_ERROR'));
    renderWithProviders(<ExportCsvButton filters={FILTERS} sort={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    expect(api.exportCsv).toHaveBeenCalledWith(FILTERS, []);
    expect(await screen.findByText('Export failed')).toBeInTheDocument();
  });
});

describe('ImagePicker', () => {
  it('previews a valid image and reports it', async () => {
    const onChange = vi.fn();
    render(<ImagePicker currentUrl={null} onChange={onChange} />);
    const file = new File(['x'], 'cover.png', { type: 'image/png' });

    await userEvent.upload(screen.getByLabelText('Imagen de portada'), file);

    expect(onChange).toHaveBeenCalledWith(file);
    expect(screen.getByRole('img', { name: 'Vista previa de la portada' })).toHaveAttribute(
      'src',
      'blob:preview',
    );
  });

  it('rejects unsupported files', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup({ applyAccept: false });
    render(<ImagePicker currentUrl="/api/uploads/old.png" onChange={onChange} />);

    await user.upload(
      screen.getByLabelText('Imagen de portada'),
      new File(['x'], 'doc.pdf', { type: 'application/pdf' }),
    );

    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByRole('alert')).toHaveTextContent(/JPEG, PNG o WEBP/);
    expect(screen.getByRole('img', { name: 'Vista previa de la portada' })).toHaveAttribute(
      'src',
      '/api/uploads/old.png',
    );
  });
});
