import type { AxiosResponse } from 'axios';

export interface PageMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

/** Mirrors the backend ResponseEnvelopeInterceptor contract. */
export interface Envelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: PageMeta;
}

export interface Page<T> {
  readonly items: T[];
  readonly meta: PageMeta;
}

export const unwrap = <T>(response: AxiosResponse<Envelope<T>>): T => response.data.data;

export function unwrapPage<T>(response: AxiosResponse<Envelope<T[]>>): Page<T> {
  const items = response.data.data;
  const meta = response.data.meta ?? {
    total: items.length,
    page: 1,
    limit: items.length,
    totalPages: 1,
  };
  return { items, meta };
}
