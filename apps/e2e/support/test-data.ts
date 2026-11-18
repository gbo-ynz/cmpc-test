/** Unique, recognizable test data so runs never collide with seed data or with each other. */
export interface BookData {
  readonly title: string;
  readonly author: string;
  readonly publisher: string;
  readonly genre: string;
  readonly price: string;
  readonly stock: string;
}

export function uniqueBook(overrides: Partial<BookData> = {}): BookData {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    title: `E2E Libro ${runId}`,
    author: 'Autor E2E',
    publisher: 'Editorial E2E',
    genre: 'Género E2E',
    price: '15990',
    stock: '5',
    ...overrides,
  };
}

// 1x1 transparent PNG: real magic bytes, so it passes the API's content sniffing.
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export const COVER_IMAGE = {
  name: 'portada.png',
  mimeType: 'image/png',
  buffer: Buffer.from(PNG_1X1_BASE64, 'base64'),
};
