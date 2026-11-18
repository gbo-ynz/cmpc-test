import { Button } from '../../../../shared/ui/Button';
import { SelectField, type SelectOption } from '../../../../shared/ui/SelectField';
import { useCatalog } from '../../application/book-queries';
import type { Availability, BookFilters, CatalogItem } from '../../domain/book.types';
import { SearchInput } from './SearchInput';

const AVAILABILITY_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Disponible' },
  { value: 'false', label: 'No disponible' },
];

const toOptions = (items: CatalogItem[] = []): SelectOption[] =>
  items.map(({ id, name }) => ({ value: id, label: name }));

interface BookFiltersBarProps {
  filters: BookFilters;
  onChange: <K extends keyof BookFilters>(key: K, value: BookFilters[K]) => void;
  onReset: () => void;
}

export function BookFiltersBar({ filters, onChange, onReset }: BookFiltersBarProps) {
  const { data: catalog } = useCatalog();

  return (
    <div className="filters card" role="search">
      <SearchInput value={filters.search} onChange={(value) => onChange('search', value)} />
      <SelectField
        label="Género"
        placeholder="Todos los géneros"
        value={filters.genreId}
        options={toOptions(catalog?.genres)}
        onValueChange={(value) => onChange('genreId', value)}
      />
      <SelectField
        label="Editorial"
        placeholder="Todas las editoriales"
        value={filters.publisherId}
        options={toOptions(catalog?.publishers)}
        onValueChange={(value) => onChange('publisherId', value)}
      />
      <SelectField
        label="Autor"
        placeholder="Todos los autores"
        value={filters.authorId}
        options={toOptions(catalog?.authors)}
        onValueChange={(value) => onChange('authorId', value)}
      />
      <SelectField
        label="Disponibilidad"
        placeholder="Todas"
        value={filters.availability}
        options={AVAILABILITY_OPTIONS}
        onValueChange={(value) => onChange('availability', value as Availability)}
      />
      <Button variant="ghost" onClick={onReset}>
        Limpiar filtros
      </Button>
    </div>
  );
}
