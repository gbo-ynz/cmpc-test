import {
  EMPTY_BOOK_FORM,
  MAX_IMAGE_BYTES,
  bookFormSchema,
  validateImage,
} from './book-form.schema';
import { serializeSort, sortState, toggleSort } from './sort';

describe('toggleSort', () => {
  it('cycles a column through asc → desc → none', () => {
    const asc = toggleSort([], 'title');
    const desc = toggleSort(asc, 'title');
    const none = toggleSort(desc, 'title');

    expect(asc).toEqual([{ field: 'title', direction: 'asc' }]);
    expect(desc).toEqual([{ field: 'title', direction: 'desc' }]);
    expect(none).toEqual([]);
  });

  it('appends new columns so click order defines priority', () => {
    const rules = toggleSort(toggleSort([], 'genre'), 'price');

    expect(serializeSort(rules)).toBe('genre:asc,price:asc');
    expect(sortState(rules, 'price')).toEqual({ direction: 'asc', priority: 2 });
    expect(sortState(rules, 'title')).toBeNull();
  });

  it('only flips the clicked column', () => {
    const rules = toggleSort(toggleSort(toggleSort([], 'genre'), 'price'), 'genre');

    expect(serializeSort(rules)).toBe('genre:desc,price:asc');
  });
});

describe('bookFormSchema', () => {
  const valid = {
    ...EMPTY_BOOK_FORM,
    title: 'Rayuela',
    authorId: 'a1',
    publisherId: 'p1',
    genreId: 'g1',
    price: 16990,
    stock: 4,
  };

  it('accepts a valid book', () => {
    expect(bookFormSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    [{ title: '   ' }, 'Ingrese el título'],
    [{ price: Number.NaN }, 'Ingrese el precio'],
    [{ price: -1 }, 'El precio no puede ser negativo'],
    [{ price: 16990.5 }, 'Ingrese el precio en pesos, sin decimales'],
    [{ title: 'x'.repeat(256) }, 'Máximo 255 caracteres'],
    [{ genreId: '' }, 'Seleccione el género'],
    [{ stock: -1 }, 'El stock no puede ser negativo'],
    [{ stock: 2.5 }, 'El stock debe ser un número entero'],
  ])('rejects %o', (override, message) => {
    const result = bookFormSchema.safeParse({ ...valid, ...override });

    expect(result.error?.issues[0]?.message).toBe(message);
  });
});

describe('validateImage', () => {
  it('accepts supported images up to 2MB', () => {
    expect(validateImage(new File(['x'], 'cover.png', { type: 'image/png' }))).toBeNull();
  });

  it('rejects other types and big files', () => {
    expect(validateImage(new File(['x'], 'doc.pdf', { type: 'application/pdf' }))).toMatch(
      /JPEG, PNG o WEBP/,
    );

    const big = new File(['x'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: MAX_IMAGE_BYTES + 1 });
    expect(validateImage(big)).toMatch(/2 MB/);
  });
});
