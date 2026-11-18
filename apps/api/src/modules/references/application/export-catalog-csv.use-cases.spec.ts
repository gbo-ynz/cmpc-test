import { FakeAuditLogger } from '../../../test-utils/fakes';
import { InMemoryAuthorRepository } from '../../../test-utils/in-memory-author.repository';
import { InMemoryGenreRepository } from '../../../test-utils/in-memory-genre.repository';
import { InMemoryPublisherRepository } from '../../../test-utils/in-memory-publisher.repository';
import { InMemoryReferenceRepository } from '../../../test-utils/in-memory-reference.repository';
import {
  ExportAuthorsCsvUseCase,
  ExportGenresCsvUseCase,
  ExportPublishersCsvUseCase,
} from './export-catalog-csv.use-cases';

function setup() {
  const references = new InMemoryReferenceRepository();
  const audit = new FakeAuditLogger();
  const authors = new InMemoryAuthorRepository(references);
  const publishers = new InMemoryPublisherRepository(references);
  const genres = new InMemoryGenreRepository(references);
  return {
    authors,
    publishers,
    genres,
    audit,
    exportAuthors: new ExportAuthorsCsvUseCase(authors, audit),
    exportPublishers: new ExportPublishersCsvUseCase(publishers, audit),
    exportGenres: new ExportGenresCsvUseCase(genres, audit),
  };
}

describe('catalog CSV exports', () => {
  it('exports every author sorted by name and audits who exported how many rows', async () => {
    const { authors, exportAuthors, audit } = setup();
    authors.seed('Sabato', { birthDate: '1911-06-24' });
    authors.seed('Borges');

    const csv = await exportAuthors.execute('admin-1');

    const lines = csv.split('\r\n');
    expect(lines[1]).toContain(',Borges,');
    expect(lines[2]).toContain(',Sabato,1911-06-24,');
    expect(audit.entries).toEqual([
      {
        action: 'EXPORT',
        entityType: 'Author',
        actorId: 'admin-1',
        metadata: { rows: 2 },
      },
    ]);
  });

  it('exports publishers with country and genres with description', async () => {
    const { publishers, genres, exportPublishers, exportGenres, audit } = setup();
    publishers.seed('Sur', { country: 'Argentina' });
    genres.seed('Poesía', { description: 'Obras en verso.' });

    expect(await exportPublishers.execute('a')).toContain(',Sur,Argentina,0');
    expect(await exportGenres.execute('a')).toContain(',Poesía,Obras en verso.,0');
    expect(audit.entries.map((entry) => entry.entityType)).toEqual(['Publisher', 'Genre']);
  });
});
