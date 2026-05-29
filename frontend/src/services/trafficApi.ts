import axios from 'axios';
import type {
  CountryTotal,
  CountryYearTotal,
  TrafficFiltersResponse,
  TrafficQuery,
  TrendPoint,
  VehicleHierarchyGroup,
  VehicleHierarchyYearGroup,
  VehicleTotal,
  VehicleYearTotal,
} from '@/types/traffic';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
});

const cleanParams = (params: Record<string, unknown>) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
);

const unwrap = async <T>(request: Promise<{ data: { data: T } }>) => {
  const response = await request;
  return response.data.data;
};

export const trafficApi = {
  getFilters: () => unwrap<TrafficFiltersResponse>(client.get('/traffic/filters')),

  getTrend: (query: TrafficQuery) => (
    unwrap<TrendPoint[]>(client.get('/traffic/trend', { params: cleanParams(query) }))
  ),

  getMultiCountryTrend: (countryCodes: string[], startYear?: number, endYear?: number) => (
    unwrap<CountryYearTotal[]>(client.get('/traffic/trend', {
      params: cleanParams({
        country_codes: countryCodes.join(','),
        start_year: startYear,
        end_year: endYear,
      }),
    }))
  ),

  getTopCountries: (year: number, limit = 10, vehicleId = 'TOTAL') => (
    unwrap<CountryTotal[]>(client.get('/traffic/top-countries', {
      params: cleanParams({ year, limit, vehicle_id: vehicleId }),
    }))
  ),

  getDistribution: (query: TrafficQuery) => (
    unwrap<VehicleTotal[]>(client.get('/traffic/distribution', { params: cleanParams(query) }))
  ),

  getHierarchyDistribution: (query: TrafficQuery) => (
    unwrap<VehicleHierarchyGroup>(client.get('/traffic/hierarchy-distribution', { params: cleanParams(query) }))
  ),

  getDeepDive: (query: TrafficQuery) => (
    unwrap<VehicleTotal[]>(client.get('/traffic/deep-dive', { params: cleanParams(query) }))
  ),

  getStacked: (query: TrafficQuery) => (
    unwrap<VehicleYearTotal[]>(client.get('/traffic/stacked', { params: cleanParams(query) }))
  ),

  getHierarchyYearly: (query: TrafficQuery) => (
    unwrap<VehicleHierarchyYearGroup>(client.get('/traffic/hierarchy-yearly', { params: cleanParams(query) }))
  ),

  getComparison: (countryA: string, countryB: string, startYear?: number, endYear?: number) => (
    unwrap<CountryYearTotal[]>(client.get('/traffic/compare', {
      params: cleanParams({
        country_a: countryA,
        country_b: countryB,
        start_year: startYear,
        end_year: endYear,
      }),
    }))
  ),

  getCumulative: (query: TrafficQuery) => (
    unwrap<VehicleYearTotal[]>(client.get('/traffic/cumulative', { params: cleanParams(query) }))
  ),
};
