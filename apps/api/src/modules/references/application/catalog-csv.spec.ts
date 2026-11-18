import { authorsToCsv, genresToCsv, publishersToCsv } from './catalog-csv';

const BOM = '\uFEFF';

describe('catalog CSV', () => {
  it('exports authors with a UTF-8 BOM, Spanish headers and quoted free text', () => {
    const csv = authorsToCsv([
      {
        id: 'a1',
        name: 'Gabriela Mistral',
        birthDate: '1889-04-07',
        biography: 'Poeta, educadora.\n"Nobel" 1945',
        activeBooks: 3,
      },
      { id: 'a2', name: 'Anónimo', birthDate: null, biography: null, activeBooks: 0 },
    ]);

    expect(csv).toBe(
      `${BOM}ID,Nombre,Fecha de nacimiento,Biografía,Libros activos\r\n` +
        'a1,Gabriela Mistral,1889-04-07,"Poeta, educadora.\n""Nobel"" 1945",3\r\n' +
        'a2,Anónimo,,,0\r\n',
    );
  });

  it('exports publishers and genres with their own detail column', () => {
    expect(publishersToCsv([{ id: 'p1', name: 'Sur', country: 'Argentina', activeBooks: 1 }])).toBe(
      `${BOM}ID,Nombre,País,Libros activos\r\np1,Sur,Argentina,1\r\n`,
    );
    expect(genresToCsv([{ id: 'g1', name: 'Poesía', description: null, activeBooks: 0 }])).toBe(
      `${BOM}ID,Nombre,Descripción,Libros activos\r\ng1,Poesía,,0\r\n`,
    );
  });

  it('neutralizes cells a spreadsheet would run as formulas', () => {
    const csv = genresToCsv([
      { id: 'g1', name: '=HYPERLINK("x")', description: null, activeBooks: 0 },
    ]);

    expect(csv).toContain("'=HYPERLINK");
  });

  it('exports only the header when there are no records', () => {
    expect(genresToCsv([])).toBe(`${BOM}ID,Nombre,Descripción,Libros activos\r\n`);
  });
});
