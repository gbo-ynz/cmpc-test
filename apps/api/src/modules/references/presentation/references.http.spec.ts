import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import {
  ADMIN,
  REGULAR_USER,
  createHttpApp,
  tokenFor,
  usersById,
} from '../../../test-utils/http-app';
import { InMemoryAuthorRepository } from '../../../test-utils/in-memory-author.repository';
import { InMemoryGenreRepository } from '../../../test-utils/in-memory-genre.repository';
import { InMemoryPublisherRepository } from '../../../test-utils/in-memory-publisher.repository';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import type { User } from '../../auth/domain/user';
import { AuthorRepository } from '../domain/author.repository';
import { GenreRepository } from '../domain/genre.repository';
import { PublisherRepository } from '../domain/publisher.repository';
import { ReferenceRepository } from '../domain/reference.repository';

let app: NestExpressApplication;
let references: InMemoryReferenceRepository;
let authors: InMemoryAuthorRepository;
let publishers: InMemoryPublisherRepository;
let genres: InMemoryGenreRepository;

beforeEach(async () => {
  references = new InMemoryReferenceRepository();
  authors = new InMemoryAuthorRepository(references);
  publishers = new InMemoryPublisherRepository(references);
  genres = new InMemoryGenreRepository(references);
  app = await createHttpApp(usersById(ADMIN, REGULAR_USER), {
    overrides: [
      { provide: ReferenceRepository, useValue: references },
      { provide: AuthorRepository, useValue: authors },
      { provide: PublisherRepository, useValue: publishers },
      { provide: GenreRepository, useValue: genres },
      { provide: TransactionManager, useValue: new FakeTransactionManager() },
      { provide: AuditLogger, useValue: new FakeAuditLogger() },
    ],
  });
});

afterEach(() => app.close());

/** Authenticated HTTP client for the given user. */
async function as(user: User) {
  const auth = { Authorization: `Bearer ${await tokenFor(app, user)}` };
  const server = app.getHttpServer();
  return {
    get: (path: string) => request(server).get(`/api${path}`).set(auth),
    post: (path: string, body: object) => request(server).post(`/api${path}`).set(auth).send(body),
    patch: (path: string, body: object) =>
      request(server).patch(`/api${path}`).set(auth).send(body),
    delete: (path: string) => request(server).delete(`/api${path}`).set(auth),
  };
}

it('lets every authenticated user list the three catalogs (the book form needs them)', async () => {
  references.seed('genres', 'Poesía', { active: 1, total: 1 });
  references.seed('genres', 'Ensayo');
  const user = await as(REGULAR_USER);

  const genres = await user.get('/genres');

  expect(genres.status).toBe(200);
  expect(genres.body.data).toEqual([
    expect.objectContaining({ name: 'Ensayo', activeBooks: 0 }),
    expect.objectContaining({ name: 'Poesía', activeBooks: 1 }),
  ]);
  expect((await user.get('/authors')).status).toBe(200);
  expect((await user.get('/publishers')).status).toBe(200);
});

it('answers 403 when a regular user tries to create, rename or delete', async () => {
  const author = references.seed('authors', 'Borges');
  const user = await as(REGULAR_USER);

  expect((await user.post('/authors', { name: 'Nuevo' })).status).toBe(403);
  expect((await user.patch(`/authors/${author.id}`, { name: 'Otro' })).status).toBe(403);
  expect((await user.delete(`/authors/${author.id}`)).status).toBe(403);
});

it('lets an administrator create (201) and answers 409 to a name repeated ignoring case', async () => {
  const admin = await as(ADMIN);

  const created = await admin.post('/publishers', { name: '  Sur ' });
  const repeated = await admin.post('/publishers', { name: 'sur' });

  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ name: 'Sur' });
  expect(repeated.status).toBe(409);
  expect(repeated.body.error.code).toBe('CONFLICT');
});

it('answers 400 to invalid bodies', async () => {
  const admin = await as(ADMIN);

  expect((await admin.post('/genres', { name: '' })).status).toBe(400);
  expect((await admin.post('/genres', { name: '   ' })).status).toBe(400);
  expect((await admin.post('/genres', { name: 'x'.repeat(81) })).status).toBe(400);
  expect((await admin.post('/genres', { name: 'Ok', extra: true })).status).toBe(400);
});

it('renames and deletes, but refuses to delete a record that has books', async () => {
  const used = references.seed('publishers', 'Con libros', { active: 0, total: 2 });
  const free = references.seed('publishers', 'Sin libros');
  const admin = await as(ADMIN);

  const renamed = await admin.patch(`/publishers/${free.id}`, { name: 'Renombrado' });

  expect(renamed.status).toBe(200);
  expect(renamed.body.data.name).toBe('Renombrado');
  expect((await admin.delete(`/publishers/${used.id}`)).status).toBe(409);
  expect((await admin.delete(`/publishers/${free.id}`)).status).toBe(204);
});

it('answers 404 to an unknown id and 400 to a malformed one', async () => {
  const admin = await as(ADMIN);

  expect((await admin.delete('/genres/00000000-0000-4000-8000-000000000000')).status).toBe(404);
  expect((await admin.delete('/genres/not-a-uuid')).status).toBe(400);
});

describe('authors (details on top of the shared catalog rules)', () => {
  it('creates an author with birth date and biography, and reads it back by id', async () => {
    const admin = await as(ADMIN);

    const created = await admin.post('/authors', {
      name: 'Gabriela Mistral',
      birthDate: '1889-04-07',
      biography: '  Poeta chilena, Premio Nobel 1945.  ',
    });
    const found = await (await as(REGULAR_USER)).get(`/authors/${created.body.data.id}`);

    expect(created.status).toBe(201);
    expect(found.status).toBe(200);
    expect(found.body.data).toMatchObject({
      name: 'Gabriela Mistral',
      birthDate: '1889-04-07',
      biography: 'Poeta chilena, Premio Nobel 1945.',
    });
  });

  it('lists authors with their details and active books', async () => {
    authors.seed('Borges', { birthDate: '1899-08-24' });
    const user = await as(REGULAR_USER);

    const response = await user.get('/authors');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        id: expect.any(String),
        name: 'Borges',
        birthDate: '1899-08-24',
        biography: null,
        activeBooks: 0,
      },
    ]);
  });

  it('paginates on the server when page or limit are sent, and lists everything otherwise', async () => {
    ['Cortázar', 'Allende', 'Borges'].forEach((name) => authors.seed(name));
    const user = await as(REGULAR_USER);

    const page = await user.get('/authors?page=2&limit=2');
    const all = await user.get('/authors');

    expect(page.status).toBe(200);
    expect(page.body.data.map((author: { name: string }) => author.name)).toEqual(['Cortázar']);
    expect(page.body.meta).toEqual({ total: 3, page: 2, limit: 2, totalPages: 2 });
    expect(all.body.data).toHaveLength(3);
    expect(all.body.meta).toBeUndefined();
    expect((await user.get('/authors?limit=101')).status).toBe(400);
    expect((await user.get('/authors?page=0')).status).toBe(400);
  });

  it('answers 400 to a malformed, impossible or future birth date', async () => {
    const admin = await as(ADMIN);
    const create = (birthDate: string) => admin.post('/authors', { name: 'X', birthDate });

    expect((await create('07-04-1889')).status).toBe(400);
    expect((await create('2024-02-30')).status).toBe(400);
    expect((await create('2999-01-01')).status).toBe(400);
    expect((await admin.post('/authors', { name: 'X', biography: 'b'.repeat(1001) })).status).toBe(
      400,
    );
  });

  it('updates only the fields received: null clears a detail, omitted keeps it', async () => {
    const author = authors.seed('Borges', { birthDate: '1899-08-24', biography: 'Cuentista.' });
    const admin = await as(ADMIN);

    const updated = await admin.patch(`/authors/${author.id}`, { biography: null });

    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      name: 'Borges',
      birthDate: '1899-08-24',
      biography: null,
    });
  });

  it('keeps names unique, answers 404 to an unknown author and lets only admins write', async () => {
    authors.seed('Borges');
    const sabato = authors.seed('Sabato');
    const admin = await as(ADMIN);
    const user = await as(REGULAR_USER);

    expect((await admin.patch(`/authors/${sabato.id}`, { name: 'borges' })).status).toBe(409);
    expect((await admin.get('/authors/00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await user.post('/authors', { name: 'Nuevo' })).status).toBe(403);
    expect((await admin.delete(`/authors/${sabato.id}`)).status).toBe(204);
  });
});

describe('publishers (country on top of the shared catalog rules)', () => {
  it('creates a publisher with country, reads it back by id and lists it with its country', async () => {
    const admin = await as(ADMIN);
    const user = await as(REGULAR_USER);

    const created = await admin.post('/publishers', { name: 'Losada', country: '  Argentina ' });
    const found = await user.get(`/publishers/${created.body.data.id}`);
    const list = await user.get('/publishers');

    expect(created.status).toBe(201);
    expect(found.body.data).toMatchObject({ name: 'Losada', country: 'Argentina' });
    expect(list.body.data).toEqual([
      { id: expect.any(String), name: 'Losada', country: 'Argentina', activeBooks: 0 },
    ]);
  });

  it('paginates on the server when page or limit are sent, and lists everything otherwise', async () => {
    ['Sur', 'Anagrama', 'Losada'].forEach((name) => publishers.seed(name));
    const user = await as(REGULAR_USER);

    const page = await user.get('/publishers?page=2&limit=2');
    const all = await user.get('/publishers');

    expect(page.body.data.map((publisher: { name: string }) => publisher.name)).toEqual(['Sur']);
    expect(page.body.meta).toEqual({ total: 3, page: 2, limit: 2, totalPages: 2 });
    expect(all.body.data).toHaveLength(3);
    expect(all.body.meta).toBeUndefined();
    expect((await user.get('/publishers?limit=101')).status).toBe(400);
  });

  it('answers 400 to a country over the limit and updates only the fields received', async () => {
    const sur = publishers.seed('Sur', { country: 'Argentina' });
    const admin = await as(ADMIN);

    expect((await admin.post('/publishers', { name: 'X', country: 'c'.repeat(81) })).status).toBe(
      400,
    );
    const updated = await admin.patch(`/publishers/${sur.id}`, { name: 'Sur Editorial' });

    expect(updated.body.data).toMatchObject({ name: 'Sur Editorial', country: 'Argentina' });
    expect((await admin.patch(`/publishers/${sur.id}`, { country: null })).body.data.country).toBe(
      null,
    );
  });

  it('keeps names unique, answers 404 to an unknown publisher and lets only admins write', async () => {
    publishers.seed('Sur');
    const losada = publishers.seed('Losada');
    const admin = await as(ADMIN);
    const user = await as(REGULAR_USER);

    expect((await admin.patch(`/publishers/${losada.id}`, { name: 'sur' })).status).toBe(409);
    expect((await admin.get('/publishers/00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await user.post('/publishers', { name: 'Nueva' })).status).toBe(403);
    expect((await admin.delete(`/publishers/${losada.id}`)).status).toBe(204);
  });
});

describe('genres (description on top of the shared catalog rules)', () => {
  it('creates a genre with description, reads it back by id and lists it with its description', async () => {
    const admin = await as(ADMIN);
    const user = await as(REGULAR_USER);

    const created = await admin.post('/genres', {
      name: 'Poesía',
      description: '  Obras en verso. ',
    });
    const found = await user.get(`/genres/${created.body.data.id}`);
    const list = await user.get('/genres');

    expect(created.status).toBe(201);
    expect(found.body.data).toMatchObject({ name: 'Poesía', description: 'Obras en verso.' });
    expect(list.body.data).toEqual([
      { id: expect.any(String), name: 'Poesía', description: 'Obras en verso.', activeBooks: 0 },
    ]);
  });

  it('paginates on the server when page or limit are sent, and lists everything otherwise', async () => {
    ['Novela', 'Cuento', 'Ensayo'].forEach((name) => genres.seed(name));
    const user = await as(REGULAR_USER);

    const page = await user.get('/genres?page=2&limit=2');
    const all = await user.get('/genres');

    expect(page.body.data.map((genre: { name: string }) => genre.name)).toEqual(['Novela']);
    expect(page.body.meta).toEqual({ total: 3, page: 2, limit: 2, totalPages: 2 });
    expect(all.body.data).toHaveLength(3);
    expect(all.body.meta).toBeUndefined();
    expect((await user.get('/genres?limit=101')).status).toBe(400);
  });

  it('answers 400 to a description over the limit and updates only the fields received', async () => {
    const poetry = genres.seed('Poesía', { description: 'Obras en verso.' });
    const admin = await as(ADMIN);

    expect((await admin.post('/genres', { name: 'X', description: 'd'.repeat(501) })).status).toBe(
      400,
    );
    const renamed = await admin.patch(`/genres/${poetry.id}`, { name: 'Poesía lírica' });

    expect(renamed.body.data).toMatchObject({
      name: 'Poesía lírica',
      description: 'Obras en verso.',
    });
    expect(
      (await admin.patch(`/genres/${poetry.id}`, { description: null })).body.data.description,
    ).toBe(null);
  });

  it('keeps names unique, answers 404 to an unknown genre and lets only admins write', async () => {
    genres.seed('Novela');
    const essay = genres.seed('Ensayo');
    const admin = await as(ADMIN);
    const user = await as(REGULAR_USER);

    expect((await admin.patch(`/genres/${essay.id}`, { name: 'novela' })).status).toBe(409);
    expect((await admin.get('/genres/00000000-0000-4000-8000-000000000000')).status).toBe(404);
    expect((await user.post('/genres', { name: 'Nuevo' })).status).toBe(403);
    expect((await admin.delete(`/genres/${essay.id}`)).status).toBe(204);
  });
});

describe('catalog CSV export', () => {
  it.each([
    [
      'authors',
      'autores',
      () => authors.seed('Borges', { biography: 'Cuentista, poeta.' }),
      'Borges',
    ],
    ['publishers', 'editoriales', () => publishers.seed('Sur', { country: 'Argentina' }), 'Sur'],
    [
      'genres',
      'generos',
      () => genres.seed('Poesía', { description: 'Obras en verso.' }),
      'Poesía',
    ],
  ])(
    'lets an administrator download every %s as a CSV attachment',
    async (path, file, seed, name) => {
      seed();
      const admin = await as(ADMIN);

      const response = await admin.get(`/${path}/export`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toBe(`attachment; filename="${file}.csv"`);
      expect(response.text.startsWith('\uFEFFID,Nombre,')).toBe(true);
      expect(response.text).toContain(name);
    },
  );

  it('exports everything, not only a page, and is not captured by the :id route', async () => {
    ['Novela', 'Cuento', 'Ensayo'].forEach((name) => genres.seed(name));
    const admin = await as(ADMIN);

    const response = await admin.get('/genres/export?page=1&limit=1');

    expect(response.status).toBe(200);
    expect(response.text.trim().split('\r\n')).toHaveLength(4);
  });

  it('is reserved to administrators', async () => {
    const user = await as(REGULAR_USER);

    expect((await user.get('/authors/export')).status).toBe(403);
    expect((await user.get('/publishers/export')).status).toBe(403);
    expect((await user.get('/genres/export')).status).toBe(403);
  });
});
