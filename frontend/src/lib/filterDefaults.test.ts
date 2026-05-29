import { describe, expect, it } from 'vitest';
import { defaultCountry, yearRangeForCountry, yearsBetween } from './filterDefaults';
import type { TrafficFiltersResponse } from '@/types/traffic';

const metadata: TrafficFiltersResponse = {
  countries: [
    { code: 'AT', label: 'Austria' },
    { code: 'DE', label: 'Germany' },
  ],
  sourceVehicleTypes: [],
  vehicleTypes: [],
  topLevelVehicleTypes: [],
  subCategoryVehicleTypes: [],
  yearRange: { min: 2018, max: 2020 },
  countryYearRanges: {
    AT: { min: 2019, max: 2020 },
  },
  recommendedDefaults: {
    country_code: 'DE',
    vehicle_id: 'TOTAL',
    start_year: 2019,
    end_year: 2020,
  },
};

describe('filterDefaults', () => {
  it('builds inclusive year ranges', () => {
    expect(yearsBetween(2018, 2020)).toEqual([2018, 2019, 2020]);
    expect(yearsBetween(2020, 2018)).toEqual([]);
  });

  it('selects recommended default country when present', () => {
    expect(defaultCountry(metadata)?.code).toBe('DE');
  });

  it('falls back to the first country when recommendation is missing', () => {
    expect(
      defaultCountry({
        ...metadata,
        recommendedDefaults: { ...metadata.recommendedDefaults, country_code: 'ZZ' },
      })?.code,
    ).toBe('AT');
  });

  it('uses per-country year ranges when available', () => {
    expect(yearRangeForCountry(metadata, 'AT')).toEqual({ min: 2019, max: 2020 });
    expect(yearRangeForCountry(metadata, 'DE')).toEqual({ min: 2018, max: 2020 });
  });
});
