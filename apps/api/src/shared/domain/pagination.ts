export interface PageRequest {
  readonly page: number;
  readonly limit: number;
}

export interface PageMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface Paginated<T> {
  readonly items: readonly T[];
  readonly meta: PageMeta;
}

export const toSkip = ({ page, limit }: PageRequest): number => (page - 1) * limit;

export function paginate<T>(
  items: readonly T[],
  total: number,
  request: PageRequest,
): Paginated<T> {
  const totalPages = Math.ceil(total / request.limit);
  return { items, meta: { total, page: request.page, limit: request.limit, totalPages } };
}

export function mapPage<T, R>(page: Paginated<T>, mapper: (item: T) => R): Paginated<R> {
  return { items: page.items.map(mapper), meta: page.meta };
}

export function isPaginated(value: unknown): value is Paginated<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Paginated<unknown>>;
  return Array.isArray(candidate.items) && typeof candidate.meta === 'object';
}
