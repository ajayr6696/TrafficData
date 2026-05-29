import fs from 'node:fs';
import { parse } from 'csv-parse';
import { config, TOTAL_VEHICLE_ID } from '../constants/config.js';
import {
  buildCalculatedTrafficRows,
  normalizeTrafficRows,
  withRawCalculationFlag,
} from '../services/trafficNormalization.js';

const asNumber = (value) => Number(value || 0);

const normalizeRow = (row, index) => ({
  id: index + 1,
  country_code: row.country_code?.trim().toUpperCase(),
  vehicle_id: row.vehicle_id?.trim().toUpperCase(),
  year: Number(row.year),
  traffic_volume: Number(row.traffic_volume),
  is_calculated: false,
});

const isValidRow = (row) => (
  row.country_code
  && row.vehicle_id
  && Number.isInteger(row.year)
  && !Number.isNaN(row.traffic_volume)
);

const sortTrafficRows = (a, b) => (
  a.country_code.localeCompare(b.country_code)
  || a.vehicle_id.localeCompare(b.vehicle_id)
  || a.year - b.year
  || a.id - b.id
);

const matchesFilters = (row, filters = {}) => {
  if (filters.countryCodes?.length && !filters.countryCodes.includes(row.country_code)) {
    return false;
  }

  if (filters.country_code && row.country_code !== filters.country_code) {
    return false;
  }

  if (filters.vehicle_id && row.vehicle_id !== filters.vehicle_id) {
    return false;
  }

  if (filters.vehicleIds?.length && !filters.vehicleIds.includes(row.vehicle_id)) {
    return false;
  }

  if (filters.excludeVehicleId && row.vehicle_id === filters.excludeVehicleId) {
    return false;
  }

  if (filters.excludeVehicleIds?.length && filters.excludeVehicleIds.includes(row.vehicle_id)) {
    return false;
  }

  if (typeof filters.isCalculated === 'boolean' && row.is_calculated !== filters.isCalculated) {
    return false;
  }

  if (filters.year && row.year !== filters.year) {
    return false;
  }

  if (filters.start_year && row.year < filters.start_year) {
    return false;
  }

  if (filters.end_year && row.year > filters.end_year) {
    return false;
  }

  return true;
};

const sumBy = (rows, keyFields) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = keyFields.map((field) => row[field]).join(':');
    const current = grouped.get(key) || {
      traffic_volume: 0,
    };

    keyFields.forEach((field) => {
      current[field] = row[field];
    });
    current.traffic_volume += row.traffic_volume;
    grouped.set(key, current);
  });

  return [...grouped.values()];
};

export class CsvTrafficRepository {
  constructor(csvPath = config.csvPath) {
    this.csvPath = csvPath;
    this.rows = null;
  }

  async loadRows() {
    if (this.rows) {
      return this.rows;
    }

    const rows = [];
    const parser = fs
      .createReadStream(this.csvPath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }));

    let index = 0;
    for await (const rawRow of parser) {
      const row = normalizeRow(rawRow, index);
      index += 1;

      if (isValidRow(row)) {
        rows.push(row);
      }
    }

    this.rows = normalizeTrafficRows(rows);
    return this.rows;
  }

  recalculateRows() {
    const rawRows = this.rows.filter((row) => !row.is_calculated).map(withRawCalculationFlag);
    const maxId = rawRows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
    this.rows = [
      ...rawRows,
      ...buildCalculatedTrafficRows(rawRows, maxId + 1),
    ];
  }

  async filteredRows(filters = {}) {
    const rows = await this.loadRows();
    return rows.filter((row) => matchesFilters(row, filters));
  }

  async getAvailableFilters() {
    const rows = await this.loadRows();
    const rawRows = rows.filter((row) => !row.is_calculated);
    const countries = [...new Set(rows.map((row) => row.country_code))].sort();
    const vehicleTypes = [...new Set(rows.map((row) => row.vehicle_id))].sort();
    const sourceVehicleTypes = [...new Set(rawRows.map((row) => row.vehicle_id))].sort();
    const years = rows.map((row) => row.year);
    const countryYearRanges = {};

    rows.forEach((row) => {
      const range = countryYearRanges[row.country_code] || { min: row.year, max: row.year };
      range.min = Math.min(range.min, row.year);
      range.max = Math.max(range.max, row.year);
      countryYearRanges[row.country_code] = range;
    });

    return {
      countries,
      vehicleTypes,
      sourceVehicleTypes,
      yearRange: {
        min: years.length ? Math.min(...years) : null,
        max: years.length ? Math.max(...years) : null,
      },
      countryYearRanges,
    };
  }

  async list(filters = {}) {
    const rows = await this.filteredRows(filters);
    const limit = filters.limit || 500;
    const offset = filters.offset || 0;

    return rows
      .toSorted(sortTrafficRows)
      .slice(offset, offset + limit);
  }

  async create(payload) {
    const rows = await this.loadRows();
    const nextId = rows.reduce((maxId, row) => Math.max(maxId, row.id), 0) + 1;
    const row = {
      id: nextId,
      is_calculated: false,
      ...payload,
    };

    const cleanRow = withRawCalculationFlag(row);
    rows.push(cleanRow);
    this.recalculateRows();
    return cleanRow;
  }

  async update(id, payload) {
    const rows = await this.loadRows();
    const index = rows.findIndex((row) => row.id === id);

    if (index === -1) {
      return null;
    }

    if (rows[index].is_calculated) {
      return null;
    }

    const updatedRow = {
      ...rows[index],
      ...payload,
    };

    rows[index] = withRawCalculationFlag(updatedRow);
    this.recalculateRows();

    return rows.find((row) => row.id === id) || null;
  }

  async remove(id) {
    const rows = await this.loadRows();
    const index = rows.findIndex((row) => row.id === id);

    if (index === -1 || rows[index].is_calculated) {
      return false;
    }

    rows.splice(index, 1);
    this.recalculateRows();
    return true;
  }

  async getYearTotals(filters = {}) {
    const rows = await this.filteredRows(filters);
    return sumBy(rows, ['year'])
      .sort((a, b) => a.year - b.year)
      .map((row) => ({
        year: row.year,
        traffic_volume: asNumber(row.traffic_volume),
        is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
      }));
  }

  async getCountryTotals(filters = {}) {
    const rows = await this.filteredRows(filters);
    const limit = filters.limit || 10;

    return sumBy(rows, ['country_code'])
      .sort((a, b) => b.traffic_volume - a.traffic_volume)
      .slice(0, limit)
      .map((row) => ({
        country_code: row.country_code,
        traffic_volume: asNumber(row.traffic_volume),
        is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
      }));
  }

  async getVehicleTotals(filters = {}) {
    const rows = await this.filteredRows(filters);

    return sumBy(rows, ['vehicle_id'])
      .sort((a, b) => b.traffic_volume - a.traffic_volume)
      .map((row) => ({
        vehicle_id: row.vehicle_id,
        traffic_volume: asNumber(row.traffic_volume),
        is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
      }));
  }

  async getVehicleYearTotals(filters = {}) {
    const rows = await this.filteredRows(filters);

    return sumBy(rows, ['year', 'vehicle_id'])
      .sort((a, b) => a.year - b.year || a.vehicle_id.localeCompare(b.vehicle_id))
      .map((row) => ({
        year: row.year,
        vehicle_id: row.vehicle_id,
        traffic_volume: asNumber(row.traffic_volume),
        is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
      }));
  }

  async getCountryYearTotals(filters = {}) {
    const rows = await this.filteredRows(filters);

    return sumBy(rows, ['year', 'country_code'])
      .sort((a, b) => a.year - b.year || a.country_code.localeCompare(b.country_code))
      .map((row) => ({
        year: row.year,
        country_code: row.country_code,
        traffic_volume: asNumber(row.traffic_volume),
        is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
      }));
  }
}

export const csvTrafficRepository = new CsvTrafficRepository();
export { TOTAL_VEHICLE_ID };
