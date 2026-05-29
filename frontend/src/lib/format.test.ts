import { describe, expect, it } from 'vitest';
import { formatCompactNumber, formatFullNumber } from './format';

describe('format', () => {
  it('formats large values in compact notation', () => {
    expect(formatCompactNumber(1_500_000)).toBe('1.5M');
    expect(formatCompactNumber(12_400)).toBe('12.4K');
  });

  it('formats values with full grouping and no decimals', () => {
    expect(formatFullNumber(7494045.604)).toBe('7,494,046');
    expect(formatFullNumber(0)).toBe('0');
  });
});
