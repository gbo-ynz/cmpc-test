import { unwrap, unwrapPage, type Envelope } from '../../../shared/api/envelope';
import { httpClient } from '../../../shared/api/http-client';
import type { Book, BooksGateway, Catalog } from '../domain/book.types';
import { toFilterParams, toListParams } from './query-params';

/** HTTP adapter implementing the BooksGateway port. */
export const booksApi: BooksGateway = {
  async list(params) {
    return unwrapPage(
      await httpClient.get<Envelope<Book[]>>('/books', { params: toListParams(params) }),
    );
  },
  async get(id) {
    return unwrap(await httpClient.get<Envelope<Book>>(`/books/${id}`));
  },
  async create(input) {
    return unwrap(await httpClient.post<Envelope<Book>>('/books', input));
  },
  async update(id, input) {
    return unwrap(await httpClient.patch<Envelope<Book>>(`/books/${id}`, input));
  },
  async remove(id) {
    await httpClient.delete(`/books/${id}`);
  },
  async uploadImage(id, file) {
    const form = new FormData();
    form.append('file', file);
    return unwrap(await httpClient.post<Envelope<Book>>(`/books/${id}/image`, form));
  },
  async exportCsv(filters, sort) {
    const params = toFilterParams(filters, sort);
    const response = await httpClient.get<Blob>('/books/export', { params, responseType: 'blob' });
    return response.data;
  },
  async catalog() {
    return unwrap(await httpClient.get<Envelope<Catalog>>('/catalog'));
  },
};
