import type { CountryOption, TrafficFiltersResponse } from '@/types/traffic';

export const yearsBetween = (min?: number | null, max?: number | null) => {
  if (!min || !max || min > max) {
    return [];
  }

  return Array.from({ length: max - min + 1 }, (_, index) => min + index);
};

export const defaultCountry = (metadata: TrafficFiltersResponse | null): CountryOption | null => {
  if (!metadata) {
    return null;
  }

  return metadata.countries.find((country) => country.code === metadata.recommendedDefaults.country_code)
    || metadata.countries[0]
    || null;
};

export const yearRangeForCountry = (
  metadata: TrafficFiltersResponse | null,
  countryCode?: string,
) => {
  if (!metadata) {
    return { min: null, max: null };
  }

  return (countryCode ? metadata.countryYearRanges[countryCode] : null)
    || {
      min: metadata.yearRange.min,
      max: metadata.yearRange.max,
    };
};
