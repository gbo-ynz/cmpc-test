import { ValidationError } from '../../../shared/domain/domain.error';
import {
  DESCRIPTION_MAX_LENGTH,
  NO_GENRE_DETAILS,
  applyGenreDetails,
  normalizeDescription,
} from './genre';

describe('genre description', () => {
  it('trims, keeps line breaks and treats blank as no description', () => {
    expect(normalizeDescription('  Narraciones\nbreves ')).toBe('Narraciones\nbreves');
    expect(normalizeDescription('   ')).toBeNull();
    expect(normalizeDescription(null)).toBeNull();
  });

  it('rejects a description longer than the limit', () => {
    expect(() => normalizeDescription('x'.repeat(DESCRIPTION_MAX_LENGTH + 1))).toThrow(
      ValidationError,
    );
    expect(normalizeDescription('x'.repeat(DESCRIPTION_MAX_LENGTH))).toHaveLength(
      DESCRIPTION_MAX_LENGTH,
    );
  });

  it('keeps the current description when it is not received and clears it with null', () => {
    const current = { description: 'Obras en verso.' };

    expect(applyGenreDetails(current, {})).toEqual(current);
    expect(applyGenreDetails(current, { description: null })).toEqual(NO_GENRE_DETAILS);
    expect(applyGenreDetails(NO_GENRE_DETAILS, { description: ' Cuentos ' })).toEqual({
      description: 'Cuentos',
    });
  });
});
