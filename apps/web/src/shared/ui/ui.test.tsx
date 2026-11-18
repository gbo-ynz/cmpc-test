import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { ApiError } from '../api/api-error';
import { AppLayout } from './AppLayout';
import { Button } from './Button';
import { CheckboxField } from './CheckboxField';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { NotFoundPage } from './NotFoundPage';
import { Pagination } from './Pagination';
import { RouteError } from './RouteError';
import { SelectField } from './SelectField';
import { SuccessBanner } from './SuccessBanner';
import { TextField } from './TextField';

describe('form primitives', () => {
  it('Button shows a spinner and disables itself while loading', () => {
    render(<Button isLoading>Save</Button>);

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    expect(screen.getByRole('status', { name: 'Procesando' })).toBeInTheDocument();
  });

  it('TextField links errors and hints to the input', () => {
    const { rerender } = render(<TextField label="Title" hint="Required" />);
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription('Required');

    rerender(<TextField label="Title" error="Title is required" />);
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
  });

  it('SelectField reports the selected value', async () => {
    const onValueChange = vi.fn();
    render(
      <SelectField
        label="Genre"
        placeholder="All"
        value=""
        options={[{ value: 'g1', label: 'Novel' }]}
        onValueChange={onValueChange}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText('Genre'), 'g1');

    expect(onValueChange).toHaveBeenCalledWith('g1');
  });

  it('CheckboxField is labelled', () => {
    render(<CheckboxField label="Available" defaultChecked />);

    expect(screen.getByLabelText('Available')).toBeChecked();
  });
});

describe('feedback components', () => {
  it('ErrorBanner shows message and validation details', () => {
    render(
      <ErrorBanner
        error={new ApiError('Validation failed', 400, 'BAD_REQUEST', ['price must be positive'])}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Validation failed');
    expect(screen.getByText('price must be positive')).toBeInTheDocument();
  });

  it('SuccessBanner announces itself and scrolls into view (saving happens at the bottom of long forms)', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<SuccessBanner message="Guardado" />);

    expect(screen.getByRole('status')).toHaveTextContent('Guardado');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
  });

  it('SuccessBanner jumps instead of animating when the user prefers reduced motion', () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));

    render(<SuccessBanner message="Guardado" />);

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'nearest' });
    vi.unstubAllGlobals();
  });

  it('EmptyState renders an optional action', () => {
    render(<EmptyState title="Nothing" action={<button>Add</button>} />);

    expect(screen.getByRole('heading', { name: 'Nothing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('navigates between pages and changes the page size', async () => {
    const onPageChange = vi.fn();
    const onLimitChange = vi.fn();
    render(
      <Pagination
        meta={{ total: 30, page: 2, limit: 10, totalPages: 3 }}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await userEvent.selectOptions(screen.getByLabelText('Por página'), '20');

    expect(onPageChange.mock.calls).toEqual([[1], [3]]);
    expect(onLimitChange).toHaveBeenCalledWith(20);
  });

  it('disables both directions on a single page', () => {
    render(
      <Pagination
        meta={{ total: 0, page: 1, limit: 10, totalPages: 0 }}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    expect(screen.getByText(/Página 1 de 1/)).toBeInTheDocument();
  });
});

describe('layout and routing screens', () => {
  it('AppLayout shows the user and triggers logout', async () => {
    const onLogout = vi.fn();
    render(
      <MemoryRouter>
        <AppLayout
          userEmail="admin@cmpc.cl"
          links={[{ to: '/authors', label: 'Autores' }]}
          onLogout={onLogout}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(screen.getByText('admin@cmpc.cl')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Autores' })).toHaveAttribute('href', '/authors');
    expect(onLogout).toHaveBeenCalled();
  });

  it('NotFoundPage links back to the inventory', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Ir al inventario' })).toHaveAttribute(
      'href',
      '/books',
    );
  });

  it('RouteError renders thrown errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const Crash = () => {
      throw new Error('kaboom');
    };
    const router = createMemoryRouter([
      { path: '/', element: <Crash />, errorElement: <RouteError /> },
    ]);

    render(<RouterProvider router={router} />);

    expect(await screen.findByText('Ocurrió un error inesperado.')).toBeInTheDocument();
  });
});
