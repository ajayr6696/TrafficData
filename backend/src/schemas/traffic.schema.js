import ajv from './ajvInstance.js';

const year = {
  type: 'integer',
  minimum: 1900,
  maximum: 2200,
};

const countryCode = {
  type: 'string',
  minLength: 1,
  maxLength: 16,
};

const vehicleId = {
  type: 'string',
  minLength: 1,
  maxLength: 64,
};

const trafficVolume = {
  type: 'number',
  minimum: 0,
};

const optionalRange = {
  start_year: year,
  end_year: year,
};

const listProperties = {
  country_code: countryCode,
  country_codes: {
    type: 'string',
    minLength: 1,
  },
  vehicle_id: vehicleId,
  parent_vehicle_id: vehicleId,
  year,
  ...optionalRange,
  limit: {
    type: 'integer',
    minimum: 1,
    maximum: 5000,
    default: 500,
  },
  offset: {
    type: 'integer',
    minimum: 0,
    default: 0,
  },
};

export const listTrafficSchema = ajv.compile({
  type: 'object',
  properties: listProperties,
  additionalProperties: false,
});

export const trendQuerySchema = ajv.compile({
  type: 'object',
  properties: {
    country_code: countryCode,
    country_codes: {
      type: 'string',
      minLength: 1,
    },
    ...optionalRange,
  },
  additionalProperties: false,
});

export const topCountriesQuerySchema = ajv.compile({
  type: 'object',
  required: ['year'],
  properties: {
    year,
    vehicle_id: vehicleId,
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 50,
      default: 10,
    },
  },
  additionalProperties: false,
});

export const distributionQuerySchema = ajv.compile({
  type: 'object',
  required: ['country_code', 'year'],
  properties: {
    country_code: countryCode,
    year,
  },
  additionalProperties: false,
});

export const deepDiveQuerySchema = ajv.compile({
  type: 'object',
  required: ['country_code', 'year', 'parent_vehicle_id'],
  properties: {
    country_code: countryCode,
    year,
    parent_vehicle_id: vehicleId,
  },
  additionalProperties: false,
});

export const stackedQuerySchema = ajv.compile({
  type: 'object',
  required: ['country_code'],
  properties: {
    country_code: countryCode,
    vehicle_id: vehicleId,
    parent_vehicle_id: vehicleId,
    ...optionalRange,
  },
  additionalProperties: false,
});

export const compareQuerySchema = ajv.compile({
  type: 'object',
  required: ['country_a', 'country_b'],
  properties: {
    country_a: countryCode,
    country_b: countryCode,
    ...optionalRange,
  },
  additionalProperties: false,
});

export const createTrafficSchema = ajv.compile({
  type: 'object',
  required: ['country_code', 'vehicle_id', 'year', 'traffic_volume'],
  properties: {
    country_code: countryCode,
    vehicle_id: vehicleId,
    year,
    traffic_volume: trafficVolume,
  },
  additionalProperties: false,
});

export const updateTrafficSchema = ajv.compile({
  type: 'object',
  minProperties: 1,
  properties: {
    country_code: countryCode,
    vehicle_id: vehicleId,
    year,
    traffic_volume: trafficVolume,
  },
  additionalProperties: false,
});
