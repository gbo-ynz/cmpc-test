import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { CheckboxField } from '../../../../shared/ui/CheckboxField';
import { TextField } from '../../../../shared/ui/TextField';
import type { BookFormValues } from '../../domain/book-form.schema';
import type { Catalog, CatalogItem } from '../../domain/book.types';

interface BookFormFieldsProps {
  register: UseFormRegister<BookFormValues>;
  errors: FieldErrors<BookFormValues>;
  catalog?: Catalog;
}

/** Existing names are suggested (datalist) to avoid near-duplicate authors/genres. */
function Suggestions({ id, items = [] }: { id: string; items?: CatalogItem[] }) {
  return (
    <datalist id={id}>
      {items.map((item) => (
        <option key={item.id} value={item.name} />
      ))}
    </datalist>
  );
}

export function BookFormFields({ register, errors, catalog }: BookFormFieldsProps) {
  return (
    <div className="form__grid">
      <TextField label="Título" error={errors.title?.message} {...register('title')} />
      <TextField
        label="Autor"
        list="authors-list"
        error={errors.author?.message}
        {...register('author')}
      />
      <TextField
        label="Editorial"
        list="publishers-list"
        error={errors.publisher?.message}
        {...register('publisher')}
      />
      <TextField
        label="Género"
        list="genres-list"
        error={errors.genre?.message}
        {...register('genre')}
      />
      <TextField
        label="Precio (CLP)"
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        error={errors.price?.message}
        {...register('price', { valueAsNumber: true })}
      />
      <CheckboxField label="Disponible para la venta" {...register('isAvailable')} />
      <Suggestions id="authors-list" items={catalog?.authors} />
      <Suggestions id="publishers-list" items={catalog?.publishers} />
      <Suggestions id="genres-list" items={catalog?.genres} />
    </div>
  );
}
