import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/render';
import { booksApi } from '../../infrastructure/books.api';
import { BookForm } from './BookForm';

vi.mock('../../infrastructure/books.api', () => ({ booksApi: { catalog: vi.fn() } }));

const VALUES = {
  title: 'Rayuela',
  author: 'Cortázar',
  publisher: 'Sudamericana',
  genre: 'Novela',
  price: 16990,
  isAvailable: true,
};

async function fillForm() {
  await userEvent.type(screen.getByLabelText('Título'), VALUES.title);
  await userEvent.type(screen.getByLabelText('Autor'), VALUES.author);
  await userEvent.type(screen.getByLabelText('Editorial'), VALUES.publisher);
  await userEvent.type(screen.getByLabelText('Género'), VALUES.genre);
  await userEvent.clear(screen.getByLabelText('Precio (CLP)'));
  await userEvent.type(screen.getByLabelText('Precio (CLP)'), String(VALUES.price));
}

describe('BookForm', () => {
  beforeEach(() => {
    vi.mocked(booksApi.catalog).mockResolvedValue({
      authors: [{ id: 'a1', name: 'Cortázar' }],
      publishers: [],
      genres: [],
    });
  });

  it('validates reactively while the user types', async () => {
    renderWithProviders(<BookForm submitLabel="Crear libro" onSubmit={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Título'), 'x');
    await userEvent.clear(screen.getByLabelText('Título'));
    await userEvent.clear(screen.getByLabelText('Precio (CLP)'));

    expect(await screen.findByText('Ingrese el título')).toBeInTheDocument();
    expect(await screen.findByText('Ingrese el precio')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear libro' })).toBeDisabled();
  });

  it('submits valid values together with the selected image', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<BookForm submitLabel="Crear libro" onSubmit={onSubmit} />);
    const image = new File(['x'], 'cover.webp', { type: 'image/webp' });

    await fillForm();
    await userEvent.upload(screen.getByLabelText('Imagen de portada'), image);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Crear libro' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(VALUES, image));
  });

  it('keeps the edit form disabled until something changes', async () => {
    renderWithProviders(
      <BookForm defaultValues={VALUES} submitLabel="Guardar cambios" onSubmit={vi.fn()} />,
    );
    const submit = screen.getByRole('button', { name: 'Guardar cambios' });

    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByLabelText('Disponible para la venta'));

    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('suggests existing authors', async () => {
    renderWithProviders(<BookForm submitLabel="Crear libro" onSubmit={vi.fn()} />);

    await waitFor(() =>
      expect(document.querySelector('#authors-list option[value="Cortázar"]')).not.toBeNull(),
    );
  });
});
