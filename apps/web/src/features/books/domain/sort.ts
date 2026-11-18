import type { SortField, SortRule } from './book.types';

/**
 * Multi-field sort. Clicking a column cycles none → asc → desc → none.
 * New columns are appended, so click order defines the priority.
 */
export function toggleSort(rules: readonly SortRule[], field: SortField): SortRule[] {
  const current = rules.find((rule) => rule.field === field);
  if (!current) return [...rules, { field, direction: 'asc' }];
  if (current.direction === 'asc') {
    return rules.map((rule) => (rule.field === field ? { field, direction: 'desc' } : rule));
  }
  return rules.filter((rule) => rule.field !== field);
}

export const serializeSort = (rules: readonly SortRule[]): string =>
  rules.map(({ field, direction }) => `${field}:${direction}`).join(',');

export interface SortState {
  readonly direction: SortRule['direction'];
  readonly priority: number;
}

export function sortState(rules: readonly SortRule[], field: SortField): SortState | null {
  const index = rules.findIndex((rule) => rule.field === field);
  return index === -1 ? null : { direction: rules[index].direction, priority: index + 1 };
}
