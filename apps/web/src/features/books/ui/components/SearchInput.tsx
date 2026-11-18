import { TextField } from '../../../../shared/ui/TextField';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Controlled input; debouncing happens in useBookListState, not here. */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <TextField
      label="Buscar"
      type="search"
      placeholder="Título, autor o editorial"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="filters__search"
    />
  );
}
