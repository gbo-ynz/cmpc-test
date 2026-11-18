import { expect, type APIRequestContext } from '@playwright/test';
import { SESSION_FILE, readStoredToken } from './session';
import type { BookData } from './test-data';

/** Reuses the token saved by auth.setup.ts: arranging data must not burn the login rate limit. */
function storedToken(): string {
  const token = readStoredToken();
  if (!token) throw new Error(`No session in ${SESSION_FILE}: did the setup project run?`);
  return token;
}

/** Arrange/cleanup through the public API; assertions always go through the UI. */
export class BooksApi {
  private readonly headers = { Authorization: `Bearer ${storedToken()}` };

  constructor(private readonly request: APIRequestContext) {}

  async create(book: BookData, isAvailable = true): Promise<string> {
    const response = await this.request.post('/api/books', {
      headers: this.headers,
      data: { ...book, price: Number(book.price), isAvailable },
    });
    expect(response.status(), await response.text()).toBe(201);
    return ((await response.json()) as { data: { id: string } }).data.id;
  }

  async remove(id: string): Promise<void> {
    const response = await this.request.delete(`/api/books/${id}`, { headers: this.headers });
    expect([204, 404]).toContain(response.status());
  }
}
