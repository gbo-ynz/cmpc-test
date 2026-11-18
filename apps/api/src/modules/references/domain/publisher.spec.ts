import { ValidationError } from '../../../shared/domain/domain.error';
import {
  COUNTRY_MAX_LENGTH,
  NO_PUBLISHER_DETAILS,
  applyPublisherDetails,
  normalizeCountry,
} from './publisher';

describe('publisher country', () => {
  it('trims, collapses inner spaces and treats blank as unknown', () => {
    expect(normalizeCountry('  Estados   Unidos ')).toBe('Estados Unidos');
    expect(normalizeCountry('   ')).toBeNull();
    expect(normalizeCountry(null)).toBeNull();
  });

  it('rejects a country longer than the limit', () => {
    expect(() => normalizeCountry('x'.repeat(COUNTRY_MAX_LENGTH + 1))).toThrow(ValidationError);
    expect(normalizeCountry('x'.repeat(COUNTRY_MAX_LENGTH))).toHaveLength(COUNTRY_MAX_LENGTH);
  });

  it('keeps the current country when it is not received and clears it with null', () => {
    const current = { country: 'Chile' };

    expect(applyPublisherDetails(current, {})).toEqual(current);
    expect(applyPublisherDetails(current, { country: null })).toEqual(NO_PUBLISHER_DETAILS);
    expect(applyPublisherDetails(NO_PUBLISHER_DETAILS, { country: ' Perú ' })).toEqual({
      country: 'Perú',
    });
  });
});
