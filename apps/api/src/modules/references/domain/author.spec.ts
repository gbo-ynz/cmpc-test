import { ValidationError } from '../../../shared/domain/domain.error';
import { NO_DETAILS, applyAuthorDetails, normalizeBiography, normalizeBirthDate } from './author';

const TODAY = new Date('2026-11-18T15:00:00Z');

describe('normalizeBirthDate', () => {
  it('accepts a real past date and today, and keeps null as "unknown"', () => {
    expect(normalizeBirthDate('1889-04-07', TODAY)).toBe('1889-04-07');
    expect(normalizeBirthDate('2026-11-18', TODAY)).toBe('2026-11-18');
    expect(normalizeBirthDate(null, TODAY)).toBeNull();
  });

  it.each(['07-04-1889', '1889-4-7', '2024-02-30', '2023-02-29', '1889-13-01', ''])(
    'rejects %p as an invalid date',
    (raw) => {
      expect(() => normalizeBirthDate(raw, TODAY)).toThrow('birthDate must be a valid date');
    },
  );

  it('accepts February 29 only in leap years', () => {
    expect(normalizeBirthDate('2024-02-29', TODAY)).toBe('2024-02-29');
  });

  it('rejects a date after today', () => {
    expect(() => normalizeBirthDate('2026-11-19', TODAY)).toThrow(
      new ValidationError('birthDate cannot be in the future'),
    );
  });
});

describe('normalizeBiography', () => {
  it('trims, keeps line breaks and turns blank text into null', () => {
    expect(normalizeBiography('  Poeta.\nNobel 1945.  ')).toBe('Poeta.\nNobel 1945.');
    expect(normalizeBiography('   ')).toBeNull();
    expect(normalizeBiography(null)).toBeNull();
  });

  it('accepts 1000 characters and rejects 1001', () => {
    expect(normalizeBiography('b'.repeat(1000))).toHaveLength(1000);
    expect(() => normalizeBiography('b'.repeat(1001))).toThrow(ValidationError);
  });
});

describe('applyAuthorDetails', () => {
  const current = { birthDate: '1899-08-24', biography: 'Cuentista.' };

  it('keeps omitted fields, clears null ones and validates the received ones', () => {
    expect(applyAuthorDetails(current, {}, TODAY)).toEqual(current);
    expect(applyAuthorDetails(current, { biography: null }, TODAY)).toEqual({
      birthDate: '1899-08-24',
      biography: null,
    });
    expect(applyAuthorDetails(NO_DETAILS, { birthDate: '1911-06-24' }, TODAY)).toEqual({
      birthDate: '1911-06-24',
      biography: null,
    });
    expect(() => applyAuthorDetails(current, { birthDate: '2999-01-01' }, TODAY)).toThrow();
  });
});
