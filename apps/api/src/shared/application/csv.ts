export type CsvValue = string | number | null;

// BOM so Excel opens UTF-8 accents (á, ñ) correctly.
export const UTF8_BOM = '\uFEFF';

// Cells starting with these characters are executed as formulas by spreadsheets.
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const NEEDS_QUOTING = /[",\r\n]/;

export function escapeCsvValue(value: CsvValue): string {
  if (value === null) return '';
  const raw = String(value);
  const safe = typeof value === 'string' && FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;
  return NEEDS_QUOTING.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export const toCsvLine = (values: readonly CsvValue[]): string =>
  `${values.map(escapeCsvValue).join(',')}\r\n`;

/** A whole small document (header + rows) for exports that fit in memory. */
export const toCsvDocument = (
  header: readonly string[],
  rows: readonly (readonly CsvValue[])[],
): string => UTF8_BOM + toCsvLine(header) + rows.map(toCsvLine).join('');
