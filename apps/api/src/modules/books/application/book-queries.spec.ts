import { ACTOR_ID, FakeAuditLogger, makeBook } from '../../../test-utils/fakes';
import { InMemoryBookRepository } from '../../../test-utils/in-memory-book.repository';
import { BookNotFoundError } from '../domain/book.errors';
import { ExportBooksCsvUseCase } from './export-books-csv.use-case';
import { GetBookUseCase } from './get-book.use-case';
import { ListBooksUseCase } from './list-books.use-case';

const QUERY = { filters: { genreId: undefined }, sort: [] };

async function readStream(stream: AsyncIterable<unknown>): Promise<string> {
  let content = '';
  for await (const chunk of stream) content += String(chunk);
  return content;
}

describe('GetBookUseCase', () => {
  it('returns the view of an existing book', async () => {
    const book = makeBook();
    const useCase = new GetBookUseCase(new InMemoryBookRepository([book]));

    await expect(useCase.execute(book.id)).resolves.toMatchObject({
      id: book.id,
      title: 'Rayuela',
    });
  });

  it('throws when the book does not exist', async () => {
    const useCase = new GetBookUseCase(new InMemoryBookRepository());

    await expect(useCase.execute('missing')).rejects.toThrow(BookNotFoundError);
  });
});

describe('ListBooksUseCase', () => {
  it('returns a page of views with metadata', async () => {
    const books = [makeBook({ title: 'A' }), makeBook({ title: 'B' }), makeBook({ title: 'C' })];
    const useCase = new ListBooksUseCase(new InMemoryBookRepository(books));

    const page = await useCase.execute({ ...QUERY, page: 2, limit: 2 });

    expect(page.items).toHaveLength(1);
    expect(page.meta).toEqual({ total: 3, page: 2, limit: 2, totalPages: 2 });
  });
});

describe('ExportBooksCsvUseCase', () => {
  it('streams a BOM, the header and one line per book, and audits the export', async () => {
    const audit = new FakeAuditLogger();
    const repository = new InMemoryBookRepository([makeBook({ title: 'Ficciones' })]);
    const useCase = new ExportBooksCsvUseCase(repository, audit);

    const csv = await readStream(await useCase.execute({ query: QUERY, actorId: ACTOR_ID }));

    const lines = csv.split('\r\n').filter(Boolean);
    expect(csv.startsWith('﻿ID,Título')).toBe(true);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Ficciones');
    expect(audit.entries[0]).toMatchObject({ action: 'EXPORT', actorId: ACTOR_ID });
  });
});
