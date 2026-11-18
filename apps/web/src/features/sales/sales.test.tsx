import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../shared/api/api-error';
import { renderWithProviders } from '../../test/render';
import type { Book } from '../books/domain/book.types';
import { booksApi } from '../books/infrastructure/books.api';
import type { Sale, SaleSummary } from './domain/sale.types';
import { salesApi } from './infrastructure/sales.api';
import SaleCreatePage from './ui/SaleCreatePage';
import SaleDetailPage from './ui/SaleDetailPage';
import { SalesPage } from './ui/SalesPage';

vi.mock('./infrastructure/sales.api', () => ({
  salesApi: {
    listPage: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    complete: vi.fn(),
    cancel: vi.fn(),
  },
}));
vi.mock('../books/infrastructure/books.api', () => ({ booksApi: { list: vi.fn() } }));

const sales = vi.mocked(salesApi);
const books = vi.mocked(booksApi);

const RAYUELA = {
  id: 'b1',
  title: 'Rayuela',
  author: 'Julio Cortázar',
  publisher: 'Sudamericana',
  genre: 'Novela',
  price: 1500,
  stock: 3,
  isAvailable: true,
} as Book;
const SUMMARY: SaleSummary = {
  id: 's1',
  status: 'PENDING',
  total: 3000,
  unitCount: 2,
  createdAt: '2026-03-10T12:00:00Z',
  createdBy: { id: 'u1', name: 'Vendedora' },
};
const SALE: Sale = {
  ...SUMMARY,
  paymentMethod: null,
  completedAt: null,
  cancelledAt: null,
  items: [{ bookId: 'b1', title: 'Rayuela', quantity: 2, unitPrice: 1500 }],
};

function pageOf<T>(items: T[], page = 1, limit = 10, total = items.length) {
  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

beforeEach(() => {
  // Block body: a returned value would be run by vitest as a cleanup callback.
  sales.listPage.mockResolvedValue(pageOf([SUMMARY]));
  books.list.mockResolvedValue(pageOf([RAYUELA]));
});

describe('SalesPage', () => {
  it('lists the sales with their total, status and creator', async () => {
    renderWithProviders(<SalesPage />);

    const row = await screen.findByRole('row', { name: /Vendedora/ });
    expect(within(row).getByText('Pendiente')).toBeInTheDocument();
    expect(within(row).getByText('$3.000')).toBeInTheDocument();
    expect(within(row).getByText('2', { selector: 'td' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Fecha',
      'Productos',
      'Total',
      'Estado',
      'Creada por',
      'Acciones',
    ]);
    expect(within(row).getByRole('link', { name: /Ver venta/ })).toHaveAttribute(
      'href',
      '/sales/s1',
    );
    expect(screen.getByRole('link', { name: 'Nueva venta' })).toHaveAttribute('href', '/sales/new');
  });

  it('offers view, complete and cancel icons on a pending sale, and only view on a final one', async () => {
    const DONE = {
      ...SUMMARY,
      id: 's2',
      status: 'COMPLETED',
      createdBy: { id: 'u2', name: 'Otra' },
    } as const;
    sales.listPage.mockResolvedValue(pageOf([SUMMARY, DONE]));
    renderWithProviders(<SalesPage />);

    const pending = await screen.findByRole('row', { name: /Vendedora/ });
    const done = screen.getByRole('row', { name: /Otra/ });

    expect(within(pending).getByRole('link', { name: /^Ver venta/ })).toBeInTheDocument();
    expect(within(pending).getByRole('button', { name: /^Completar venta/ })).toBeInTheDocument();
    expect(within(pending).getByRole('button', { name: /^Cancelar venta/ })).toBeInTheDocument();
    expect(within(done).getByRole('link', { name: /^Ver venta/ })).toBeInTheDocument();
    expect(within(done).queryByRole('button')).not.toBeInTheDocument();
  });

  it('completes from the list: the check opens a popup to choose the payment method', async () => {
    sales.complete.mockResolvedValue({ ...SALE, status: 'COMPLETED', paymentMethod: 'CASH' });
    renderWithProviders(<SalesPage />);
    await userEvent.click(await screen.findByRole('button', { name: /^Completar venta/ }));

    const dialog = screen.getByRole('dialog', { name: 'Completar venta' });
    expect(within(dialog).getByRole('button', { name: 'Aceptar' })).toBeDisabled();
    await userEvent.selectOptions(within(dialog).getByLabelText('Método de pago'), 'CASH');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => expect(sales.complete).toHaveBeenCalledWith('s1', 'CASH'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the popup open and explains the error when the sale cannot be completed', async () => {
    sales.complete.mockRejectedValue(new ApiError('x', 409, 'CONFLICT'));
    renderWithProviders(<SalesPage />);
    await userEvent.click(await screen.findByRole('button', { name: /^Completar venta/ }));
    const dialog = screen.getByRole('dialog');

    await userEvent.selectOptions(within(dialog).getByLabelText('Método de pago'), 'CASH');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Aceptar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('No se descontó nada');
  });

  it('closes the popup without completing when the user goes back', async () => {
    renderWithProviders(<SalesPage />);
    await userEvent.click(await screen.findByRole('button', { name: /^Completar venta/ }));

    await userEvent.click(screen.getByRole('button', { name: 'Volver' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sales.complete).not.toHaveBeenCalled();
  });

  it('cancels from the list only after confirming', async () => {
    sales.cancel.mockResolvedValue({ ...SALE, status: 'CANCELLED' });
    renderWithProviders(<SalesPage />);
    await userEvent.click(await screen.findByRole('button', { name: /^Cancelar venta/ }));

    expect(sales.cancel).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));

    await waitFor(() => expect(sales.cancel).toHaveBeenCalledWith('s1'));
  });

  it('filters by status on the server and goes back to the first page', async () => {
    sales.listPage.mockImplementation(async ({ page, limit }) =>
      pageOf([SUMMARY], page, limit, 25),
    );
    renderWithProviders(<SalesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'Siguiente' }));
    await waitFor(() => expect(sales.listPage).toHaveBeenCalledWith({ page: 2, limit: 10 }));

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'COMPLETED');

    await waitFor(() =>
      expect(sales.listPage).toHaveBeenCalledWith({ page: 1, limit: 10, status: 'COMPLETED' }),
    );
  });

  it('colors each status: pending in amber, completed in green and cancelled in red', async () => {
    const sale = (id: string, status: SaleSummary['status']) => ({ ...SUMMARY, id, status });
    sales.listPage.mockResolvedValue(
      pageOf([sale('s1', 'PENDING'), sale('s2', 'COMPLETED'), sale('s3', 'CANCELLED')]),
    );
    renderWithProviders(<SalesPage />);

    const badge = (label: string) => screen.getByText(label, { selector: '.badge' });
    await screen.findByRole('table');

    expect(badge('Pendiente')).toHaveClass('badge--warning');
    expect(badge('Completada')).toHaveClass('badge--success');
    expect(badge('Cancelada')).toHaveClass('badge--danger');
  });

  it('shows an empty state when there are no sales', async () => {
    sales.listPage.mockResolvedValue(pageOf([]));
    renderWithProviders(<SalesPage />);

    expect(await screen.findByText('No hay ventas para mostrar')).toBeInTheDocument();
  });
});

describe('SaleCreatePage', () => {
  const addRayuela = async () =>
    userEvent.click(await screen.findByRole('button', { name: 'Agregar Rayuela' }));

  it('searches only available books and caps the quantity at the stock', async () => {
    renderWithProviders(<SaleCreatePage />);
    await addRayuela();

    expect(books.list).toHaveBeenCalledWith(
      expect.objectContaining({ filters: expect.objectContaining({ availability: 'true' }) }),
    );
    const quantity = screen.getByLabelText('Cantidad de Rayuela');
    await userEvent.clear(quantity);
    await userEvent.type(quantity, '9');

    expect(quantity).toHaveValue(3);
    expect(screen.getAllByText('$4.500').length).toBeGreaterThan(0);
  });

  it('does not repeat a book and removes lines', async () => {
    renderWithProviders(<SaleCreatePage />);
    await addRayuela();
    await userEvent.click(screen.getByRole('button', { name: 'Agregar Rayuela' }));

    expect(screen.getAllByLabelText('Cantidad de Rayuela')).toHaveLength(1);
    expect(screen.getByLabelText('Cantidad de Rayuela')).toHaveValue(2);
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Rayuela' }));
    expect(screen.queryByLabelText('Cantidad de Rayuela')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear venta' })).toBeDisabled();
  });

  it('creates the sale and goes back to the sales list', async () => {
    sales.create.mockResolvedValue(SALE);
    renderWithProviders(<SaleCreatePage />, {
      route: '/sales/new',
      path: '/sales/new',
      extraRoutes: { '/sales': <p>Listado de ventas</p> },
    });
    await addRayuela();
    await userEvent.click(screen.getByRole('button', { name: 'Crear venta' }));

    await waitFor(() => expect(sales.create).toHaveBeenCalledWith([{ bookId: 'b1', quantity: 1 }]));
    expect(await screen.findByText('Listado de ventas')).toBeInTheDocument();
  });

  it('keeps the lines and explains the error when the API rejects the sale', async () => {
    sales.create.mockRejectedValue(new ApiError('x', 400, 'VALIDATION'));
    renderWithProviders(<SaleCreatePage />);
    await addRayuela();
    await userEvent.click(screen.getByRole('button', { name: 'Crear venta' }));

    expect(await screen.findByText('No se pudo crear la venta')).toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad de Rayuela')).toBeInTheDocument();
  });
});

describe('SaleDetailPage', () => {
  const renderDetail = (sale: Sale) => {
    sales.get.mockResolvedValue(sale);
    return renderWithProviders(<SaleDetailPage />, { route: '/sales/s1', path: '/sales/:id' });
  };

  it('shows the lines with the saved prices and offers both actions while pending', async () => {
    renderDetail(SALE);

    expect(await screen.findByRole('link', { name: 'Rayuela' })).toHaveAttribute(
      'href',
      '/books/b1',
    );
    expect(screen.getAllByText('$3.000').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Completar venta' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar venta' })).toBeInTheDocument();
  });

  it('completes with the chosen payment method', async () => {
    sales.complete.mockResolvedValue({ ...SALE, status: 'COMPLETED', paymentMethod: 'DEBIT_CARD' });
    renderDetail(SALE);

    await userEvent.selectOptions(await screen.findByLabelText('Método de pago'), 'DEBIT_CARD');
    await userEvent.click(screen.getByRole('button', { name: 'Completar venta' }));

    await waitFor(() => expect(sales.complete).toHaveBeenCalledWith('s1', 'DEBIT_CARD'));
  });

  it('explains that nothing was discounted when there is not enough stock', async () => {
    sales.complete.mockRejectedValue(new ApiError('x', 409, 'CONFLICT'));
    renderDetail(SALE);

    await userEvent.selectOptions(await screen.findByLabelText('Método de pago'), 'CASH');
    await userEvent.click(screen.getByRole('button', { name: 'Completar venta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No se descontó nada');
  });

  it('asks for confirmation before cancelling', async () => {
    sales.cancel.mockResolvedValue({ ...SALE, status: 'CANCELLED' });
    renderDetail(SALE);
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar venta' }));

    expect(sales.cancel).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }));

    await waitFor(() => expect(sales.cancel).toHaveBeenCalledWith('s1'));
  });

  it.each([
    ['COMPLETED', 'Completada', 'Tarjeta de crédito'],
    ['CANCELLED', 'Cancelada', null],
  ] as const)('a %s sale is final: it shows no actions', async (status, label, method) => {
    renderDetail({
      ...SALE,
      status,
      paymentMethod: method ? 'CREDIT_CARD' : null,
      completedAt: status === 'COMPLETED' ? '2026-03-11T10:00:00Z' : null,
      cancelledAt: status === 'CANCELLED' ? '2026-03-11T10:00:00Z' : null,
    });

    expect(await screen.findByText(label, { selector: '.badge' })).toBeInTheDocument();
    if (method) expect(screen.getByText(method)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Completar venta' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancelar venta' })).not.toBeInTheDocument();
  });
});
