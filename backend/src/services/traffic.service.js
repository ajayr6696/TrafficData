import HttpError from '../error/HttpError.js';
import { TOTAL_VEHICLE_ID } from '../constants/config.js';
import {
  enrichCountryRow,
  enrichTrafficRow,
  enrichVehicleRow,
  getVehicleChildren,
  getVehicleMetadata,
  TOP_LEVEL_VEHICLE_IDS,
  toCountryOption,
  toSourceVehicleOption,
  toVehicleOption,
  VEHICLE_HIERARCHY_GROUPS,
  VEHICLE_METADATA,
} from '../constants/trafficMetadata.js';
import { config } from '../constants/config.js';
import { csvTrafficRepository } from '../repositories/csvTraffic.repository.js';

const trafficRepository = config.databaseUrl && config.env !== 'test'
  ? (await import('../repositories/traffic.repository.js')).trafficRepository
  : csvTrafficRepository;

const stripEmpty = (filters) => Object.fromEntries(
  Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
);

const assertValidRange = (filters) => {
  if (filters.start_year && filters.end_year && filters.start_year > filters.end_year) {
    throw new HttpError(400, 'start_year must be less than or equal to end_year');
  }
};

const uniqueKnownVehicleIds = (vehicleIds) => (
  [...new Set(vehicleIds)].filter((vehicleId) => VEHICLE_METADATA[vehicleId])
);

const vehicleOrder = (vehicleId) => {
  const index = TOP_LEVEL_VEHICLE_IDS.indexOf(vehicleId);
  return index === -1 ? TOP_LEVEL_VEHICLE_IDS.length : index;
};

export class TrafficService {
  constructor(repository = trafficRepository) {
    this.repository = repository;
  }

  totalFilters(filters = {}) {
    assertValidRange(filters);
    return stripEmpty({
      ...filters,
      vehicle_id: TOTAL_VEHICLE_ID,
      excludeVehicleId: undefined,
      isCalculated: true,
    });
  }

  subCategoryFilters(filters = {}) {
    assertValidRange(filters);
    const vehicleId = filters.vehicle_id === TOTAL_VEHICLE_ID ? undefined : filters.vehicle_id;

    return stripEmpty({
      ...filters,
      vehicle_id: vehicleId,
      excludeVehicleId: TOTAL_VEHICLE_ID,
    });
  }

  topLevelFilters(filters = {}) {
    assertValidRange(filters);
    return stripEmpty({
      ...filters,
      vehicle_id: undefined,
      excludeVehicleId: undefined,
      vehicleIds: TOP_LEVEL_VEHICLE_IDS,
      isCalculated: true,
    });
  }

  childVehicleFilters(filters = {}) {
    assertValidRange(filters);
    const parentVehicleId = filters.parent_vehicle_id || filters.vehicle_id || 'LOR';
    const parent = getVehicleMetadata(parentVehicleId);
    const vehicleIds = getVehicleChildren(parentVehicleId);

    if (parent.level !== 'top-level') {
      throw new HttpError(400, 'parent_vehicle_id must be a top-level vehicle category');
    }

    return stripEmpty({
      ...filters,
      parent_vehicle_id: undefined,
      vehicle_id: undefined,
      vehicleIds,
      excludeVehicleId: undefined,
    });
  }

  async getParentVehicleTotals(filters) {
    return this.repository.getVehicleTotals(this.topLevelFilters(filters));
  }

  async getParentVehicleYearTotals(filters) {
    const rows = await this.repository.getVehicleYearTotals(this.topLevelFilters(filters));
    return rows.sort((a, b) => a.year - b.year || vehicleOrder(a.vehicle_id) - vehicleOrder(b.vehicle_id));
  }

  async getFilters() {
    const filters = await this.repository.getAvailableFilters();
    const availableVehicleIds = new Set(filters.vehicleTypes);
    const availableCountryCodes = new Set(filters.countries);
    const sourceVehicleTypes = (filters.sourceVehicleTypes || filters.vehicleTypes || [])
      .map(toSourceVehicleOption);
    const vehicleTypes = uniqueKnownVehicleIds(filters.vehicleTypes).map(toVehicleOption);
    const topLevelVehicleTypes = TOP_LEVEL_VEHICLE_IDS
      .filter((vehicleId) => availableVehicleIds.has(vehicleId))
      .map(toVehicleOption);
    const countryOptions = filters.countries
      .filter((countryCode) => availableCountryCodes.has(countryCode))
      .map(toCountryOption);
    const defaultCountry = await this.getRecommendedCountry(countryOptions, filters.countryYearRanges || {});
    const defaultVehicle = topLevelVehicleTypes.find((vehicle) => vehicle.has_children) || topLevelVehicleTypes[0];

    return {
      countries: countryOptions,
      sourceVehicleTypes,
      vehicleTypes,
      topLevelVehicleTypes,
      subCategoryVehicleTypes: vehicleTypes.filter((vehicle) => vehicle.level === 'sub-category'),
      yearRange: filters.yearRange,
      countryYearRanges: filters.countryYearRanges || {},
      recommendedDefaults: {
        country_code: defaultCountry?.code || countryOptions[0]?.code || '',
        vehicle_id: defaultVehicle?.code || 'LOR',
        start_year: defaultCountry ? filters.countryYearRanges?.[defaultCountry.code]?.min : filters.yearRange.min,
        end_year: defaultCountry ? filters.countryYearRanges?.[defaultCountry.code]?.max : filters.yearRange.max,
      },
    };
  }

  async getRecommendedCountry(countryOptions, countryYearRanges) {
    const scoredCountries = await Promise.all(countryOptions.map(async (country) => {
      const range = countryYearRanges[country.code];
      if (!range) {
        return {
          country,
          year: 0,
          categoryCount: 0,
          volume: 0,
        };
      }

      const rows = await this.getParentVehicleTotals({
        country_code: country.code,
        year: range.max,
      });

      return {
        country,
        year: range.max,
        categoryCount: rows.length,
        volume: rows.reduce((sum, row) => sum + row.traffic_volume, 0),
      };
    }));

    scoredCountries.sort((a, b) => (
      b.categoryCount - a.categoryCount
      || b.year - a.year
      || b.volume - a.volume
      || a.country.code.localeCompare(b.country.code)
    ));

    return scoredCountries[0]?.country;
  }

  async listTraffic(filters) {
    assertValidRange(filters);
    const rows = await this.repository.list(stripEmpty(filters));
    return rows.map(enrichTrafficRow);
  }

  async createTraffic(payload) {
    const row = await this.repository.create(payload);
    return enrichTrafficRow(row);
  }

  async updateTraffic(id, payload) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, 'A valid numeric traffic row id is required');
    }

    const cleanPayload = stripEmpty(payload);
    if (!Object.keys(cleanPayload).length) {
      throw new HttpError(400, 'At least one field is required for update');
    }

    const updated = await this.repository.update(id, cleanPayload);
    if (!updated) {
      throw new HttpError(404, `Traffic row ${id} was not found`);
    }

    return enrichTrafficRow(updated);
  }

  async deleteTraffic(id) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, 'A valid numeric traffic row id is required');
    }

    const removed = await this.repository.remove(id);
    if (!removed) {
      throw new HttpError(404, `Traffic row ${id} was not found`);
    }
  }

  async getTotalTrend(filters) {
    if (filters.countryCodes?.length) {
      const rows = await this.repository.getCountryYearTotals(stripEmpty({
        countryCodes: filters.countryCodes,
        start_year: filters.start_year,
        end_year: filters.end_year,
        vehicle_id: TOTAL_VEHICLE_ID,
        isCalculated: true,
      }));

      return rows.map(enrichCountryRow);
    }

    return this.repository.getYearTotals(this.totalFilters(filters));
  }

  async getTopCountries({ year, limit, vehicle_id: vehicleId }) {
    const rows = await this.getCountryTotalsForVehicle({ year, limit, vehicle_id: vehicleId || TOTAL_VEHICLE_ID });
    return rows.map(enrichCountryRow);
  }

  async getCountryTotalsForVehicle({ year, limit = 10, vehicle_id: vehicleId }) {
    if (!vehicleId || vehicleId === TOTAL_VEHICLE_ID) {
      return this.repository.getCountryTotals(this.totalFilters({ year, limit }));
    }

    const vehicle = getVehicleMetadata(vehicleId);
    const isTopLevelVehicle = vehicle.level === 'top-level';
    const rows = await this.repository.getCountryTotals(stripEmpty({
      year,
      limit,
      vehicle_id: isTopLevelVehicle ? vehicleId : undefined,
      vehicleIds: isTopLevelVehicle ? undefined : [vehicleId],
      isCalculated: isTopLevelVehicle ? true : undefined,
    }));

    return rows.map((row) => ({
      ...row,
      vehicle_id: vehicleId,
      vehicle_label: getVehicleMetadata(vehicleId).label,
      is_calculated: isTopLevelVehicle,
    }));
  }

  async getVehicleDistribution(filters) {
    const rows = await this.getParentVehicleTotals(filters);
    return rows.map(enrichVehicleRow);
  }

  async getStackedTraffic(filters) {
    const rows = await this.getParentVehicleYearTotals(filters);
    return rows.map(enrichVehicleRow);
  }

  async getVehicleDeepDive(filters) {
    const rows = await this.repository.getVehicleTotals(this.childVehicleFilters(filters));
    return rows.map(enrichVehicleRow);
  }

  async getHierarchyDistribution(filters) {
    return {
      mainGroups: await this.getVehicleDistribution(filters),
      lorries: await this.getVehicleGroupTotals(filters, VEHICLE_HIERARCHY_GROUPS.lorries),
      buses: await this.getVehicleGroupTotals(filters, VEHICLE_HIERARCHY_GROUPS.buses),
      motorcycles: await this.getVehicleGroupTotals(filters, VEHICLE_HIERARCHY_GROUPS.motorcycles),
    };
  }

  async getHierarchyYearly(filters) {
    return {
      mainGroups: await this.getStackedTraffic(filters),
      lorries: await this.getVehicleGroupYearTotals(filters, VEHICLE_HIERARCHY_GROUPS.lorries),
      buses: await this.getVehicleGroupYearTotals(filters, VEHICLE_HIERARCHY_GROUPS.buses),
      motorcycles: await this.getVehicleGroupYearTotals(filters, VEHICLE_HIERARCHY_GROUPS.motorcycles),
    };
  }

  async getVehicleGroupTotals(filters, vehicleIds) {
    const rows = await this.repository.getVehicleTotals(stripEmpty({
      ...filters,
      vehicle_id: undefined,
      parent_vehicle_id: undefined,
      vehicleIds,
    }));

    return rows.map(enrichVehicleRow);
  }

  async getVehicleGroupYearTotals(filters, vehicleIds) {
    const rows = await this.repository.getVehicleYearTotals(stripEmpty({
      ...filters,
      vehicle_id: undefined,
      parent_vehicle_id: undefined,
      vehicleIds,
    }));

    return rows.map(enrichVehicleRow);
  }

  async getCountryComparison(filters) {
    assertValidRange(filters);
    const rows = await this.repository.getCountryYearTotals(stripEmpty({
      countryCodes: filters.countries,
      start_year: filters.start_year,
      end_year: filters.end_year,
      vehicle_id: TOTAL_VEHICLE_ID,
      isCalculated: true,
    }));

    return rows.map(enrichCountryRow);
  }

  async getCumulativeComposition(filters) {
    const rows = await this.getParentVehicleYearTotals(filters);
    const years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
    const vehicleIds = [...new Set(rows.map((row) => row.vehicle_id))].sort();
    const byYearVehicle = new Map(rows.map((row) => [`${row.year}:${row.vehicle_id}`, row.traffic_volume]));
    const runningTotals = new Map(vehicleIds.map((vehicleId) => [vehicleId, 0]));
    const cumulativeRows = [];

    years.forEach((year) => {
      vehicleIds.forEach((vehicleId) => {
        const key = `${year}:${vehicleId}`;
        const nextValue = (runningTotals.get(vehicleId) || 0) + (byYearVehicle.get(key) || 0);
        runningTotals.set(vehicleId, nextValue);

        cumulativeRows.push(enrichVehicleRow({
          year,
          vehicle_id: vehicleId,
          traffic_volume: nextValue,
        }));
      });
    });

    return cumulativeRows;
  }
}

export const trafficService = new TrafficService();
