import type { SelectOption } from '../../../shared/ui/SelectField';
import { useReferences } from '../../references/application/reference-hooks';
import type { Reference } from '../../references/domain/reference.types';

export interface BookFormOptions {
  readonly authors: readonly SelectOption[];
  readonly publishers: readonly SelectOption[];
  readonly genres: readonly SelectOption[];
}

const toOptions = (items: readonly Reference[] = []): SelectOption[] =>
  items.map(({ id, name }) => ({ value: id, label: name }));

/**
 * Every author, publisher and genre (not only those with active books): a new author with no
 * books yet must be selectable. The inventory filters use the narrower /catalog instead.
 */
export function useBookFormOptions(): BookFormOptions {
  const { data: authors } = useReferences('authors');
  const { data: publishers } = useReferences('publishers');
  const { data: genres } = useReferences('genres');
  return {
    authors: toOptions(authors),
    publishers: toOptions(publishers),
    genres: toOptions(genres),
  };
}
