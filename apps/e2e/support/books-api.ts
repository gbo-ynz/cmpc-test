import { expect, type APIRequestContext } from '@playwright/test';
import { SESSION_FILE, readStoredToken } from './session';
import type { BookData } from './test-data';

type CatalogKind = 'authors' | 'publishers' | 'genres';

/** Reuses the token saved by auth.setup.ts: arranging data must not burn the login rate limit. */
function storedToken(): string {
  const token = readStoredToken();
  if (!token) throw new Error(`No session in ${SESSION_FILE}: did the setup project run?`);
  return token;
}

const idOf = async (response: { json(): Promise<unknown> }) =>
  ((await response.json()) as { data: { id: string } }).data.id;

/** Arrange/cleanup through the public API (as the admin session); assertions go through the UI. */
export class BooksApi {
  private readonly headers = { Authorization: `Bearer ${storedToken()}` };

  constructor(private readonly request: APIRequestContext) {}

  /** Finds a catalog record by name, or creates it: books only reference existing records. */
  async ensureReference(kind: CatalogKind, name: string): Promise<string> {
    const list = await this.request.get(`/api/${kind}`, { headers: this.headers });
    const items = ((await list.json()) as { data: Array<{ id: string; name: string }> }).data;
    const existing = items.find((item) => item.name === name);
    if (existing) return existing.id;
    const created = await this.request.post(`/api/${kind}`, {
      headers: this.headers,
      data: { name },
    });
    expect(created.status(), await created.text()).toBe(201);
    return idOf(created);
  }

  async create(book: BookData): Promise<string> {
    const data = {
      title: book.title,
      price: Number(book.price),
      stock: Number(book.stock),
      authorId: await this.ensureReference('authors', book.author),
      publisherId: await this.ensureReference('publishers', book.publisher),
      genreId: await this.ensureReference('genres', book.genre),
    };
    const response = await this.request.post('/api/books', { headers: this.headers, data });
    expect(response.status(), await response.text()).toBe(201);
    return idOf(response);
  }

  async remove(id: string): Promise<void> {
    const response = await this.request.delete(`/api/books/${id}`, { headers: this.headers });
    expect([204, 404]).toContain(response.status());
  }
}
