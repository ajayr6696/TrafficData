const normalizeCode = (value) => (
  typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : undefined
);

const numberOrUndefined = (value) => (
  value === undefined || value === null || value === '' ? undefined : Number(value)
);

export const toTrafficFilters = (query) => ({
  country_code: normalizeCode(query.country_code),
  countryCodes: typeof query.country_codes === 'string'
    ? query.country_codes.split(',').map(normalizeCode).filter(Boolean)
    : undefined,
  vehicle_id: normalizeCode(query.vehicle_id),
  parent_vehicle_id: normalizeCode(query.parent_vehicle_id),
  year: numberOrUndefined(query.year),
  start_year: numberOrUndefined(query.start_year),
  end_year: numberOrUndefined(query.end_year),
  limit: numberOrUndefined(query.limit),
  offset: numberOrUndefined(query.offset),
});

export const toTopCountriesQuery = (query) => ({
  year: Number(query.year),
  limit: Number(query.limit || 10),
  vehicle_id: normalizeCode(query.vehicle_id),
});

export const toCompareFilters = (query) => ({
  countries: [normalizeCode(query.country_a), normalizeCode(query.country_b)].filter(Boolean),
  start_year: numberOrUndefined(query.start_year),
  end_year: numberOrUndefined(query.end_year),
});

export const toTrafficPayload = (body) => ({
  country_code: normalizeCode(body.country_code),
  vehicle_id: normalizeCode(body.vehicle_id),
  year: Number(body.year),
  traffic_volume: Number(body.traffic_volume),
});

export const toTrafficPatchPayload = (body) => ({
  country_code: normalizeCode(body.country_code),
  vehicle_id: normalizeCode(body.vehicle_id),
  year: numberOrUndefined(body.year),
  traffic_volume: numberOrUndefined(body.traffic_volume),
});
