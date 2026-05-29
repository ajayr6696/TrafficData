import { describe, expect, it, vi } from 'vitest';
import { TrafficService } from '../src/services/traffic.service.js';
import { buildCalculatedTrafficRows } from '../src/services/trafficNormalization.js';

const createRepository = () => ({
  getYearTotals: vi.fn().mockResolvedValue([]),
  getVehicleTotals: vi.fn().mockResolvedValue([]),
  getVehicleYearTotals: vi.fn().mockResolvedValue([]),
  getCountryYearTotals: vi.fn().mockResolvedValue([]),
});

describe('TrafficService chart semantics', () => {
  it('builds calculated absolute totals, parent totals, and unidentified parent buckets', () => {
    const rows = buildCalculatedTrafficRows([
      { country_code: 'AT', vehicle_id: 'TOTAL', year: 2020, traffic_volume: 1000 },
      { country_code: 'AT', vehicle_id: 'LOR', year: 2020, traffic_volume: 100 },
      { country_code: 'AT', vehicle_id: 'LOR_LE3P5', year: 2020, traffic_volume: 8 },
      { country_code: 'AT', vehicle_id: 'LOR_GT6', year: 2020, traffic_volume: 12 },
      { country_code: 'AT', vehicle_id: 'CAR', year: 2020, traffic_volume: 20 },
    ]);

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        vehicle_id: 'TOTAL',
        traffic_volume: 1140,
        is_calculated: true,
      }),
      expect.objectContaining({
        vehicle_id: 'LOR_UNIDENTIFIED',
        traffic_volume: 100,
        is_calculated: true,
      }),
      expect.objectContaining({
        vehicle_id: 'LOR',
        traffic_volume: 120,
        is_calculated: true,
      }),
      expect.objectContaining({
        vehicle_id: 'CAR_UNIDENTIFIED',
        traffic_volume: 20,
        is_calculated: true,
      }),
      expect.objectContaining({
        vehicle_id: 'CAR',
        traffic_volume: 20,
        is_calculated: true,
      }),
      expect.objectContaining({
        vehicle_id: 'RDMVEH_OTH_UNIDENTIFIED',
        traffic_volume: 1000,
        is_calculated: true,
      }),
      expect.objectContaining({
        vehicle_id: 'RDMVEH_OTH',
        traffic_volume: 1000,
        is_calculated: true,
      }),
    ]));
  });

  it('uses calculated TOTAL rows for aggregate trend charts', async () => {
    const repository = createRepository();
    const service = new TrafficService(repository);

    await service.getTotalTrend({ country_code: 'AT', start_year: 2019, end_year: 2021 });

    expect(repository.getYearTotals).toHaveBeenCalledWith({
      country_code: 'AT',
      start_year: 2019,
      end_year: 2021,
      vehicle_id: 'TOTAL',
      isCalculated: true,
    });
  });

  it('uses calculated parent totals for vehicle distribution', async () => {
    const repository = createRepository();
    repository.getVehicleTotals.mockResolvedValueOnce([
      { vehicle_id: 'LOR', traffic_volume: 120, is_calculated: true },
      { vehicle_id: 'CAR', traffic_volume: 20, is_calculated: true },
    ]);
    const service = new TrafficService(repository);

    const rows = await service.getVehicleDistribution({ country_code: 'AT', year: 2020 });

    expect(repository.getVehicleTotals).toHaveBeenCalledWith({
      country_code: 'AT',
      year: 2020,
      vehicleIds: ['CAR', 'LOR', 'MOTO', 'BUS', 'BIKE', 'RDMVEH_OTH'],
      isCalculated: true,
    });
    expect(rows).toEqual([
      expect.objectContaining({ vehicle_id: 'LOR', traffic_volume: 120, is_calculated: true }),
      expect.objectContaining({ vehicle_id: 'CAR', traffic_volume: 20, is_calculated: true }),
    ]);
  });

  it('uses child vehicle IDs and unidentified buckets for parent deep-dive charts', async () => {
    const repository = createRepository();
    const service = new TrafficService(repository);

    await service.getVehicleDeepDive({ country_code: 'AT', year: 2020, parent_vehicle_id: 'LOR' });

    expect(repository.getVehicleTotals).toHaveBeenCalledWith({
      country_code: 'AT',
      year: 2020,
      vehicleIds: ['LOR_UNIDENTIFIED', 'LOR_LE3P5', 'LOR_GT3P5-6', 'LOR_GT6', 'TRC'],
    });
  });

  it('computes cumulative vehicle composition over time', async () => {
    const repository = createRepository();
    repository.getVehicleYearTotals.mockResolvedValueOnce([
      { year: 2020, vehicle_id: 'CAR', traffic_volume: 10, is_calculated: true },
      { year: 2020, vehicle_id: 'BUS', traffic_volume: 5, is_calculated: true },
      { year: 2021, vehicle_id: 'CAR', traffic_volume: 20, is_calculated: true },
      { year: 2021, vehicle_id: 'BUS', traffic_volume: 7, is_calculated: true },
    ]);
    const service = new TrafficService(repository);

    const rows = await service.getCumulativeComposition({ country_code: 'AT' });

    expect(rows).toEqual([
      expect.objectContaining({ year: 2020, vehicle_id: 'BUS', vehicle_label: 'Buses', traffic_volume: 5 }),
      expect.objectContaining({ year: 2020, vehicle_id: 'CAR', vehicle_label: 'Passenger cars', traffic_volume: 10 }),
      expect.objectContaining({ year: 2021, vehicle_id: 'BUS', vehicle_label: 'Buses', traffic_volume: 12 }),
      expect.objectContaining({ year: 2021, vehicle_id: 'CAR', vehicle_label: 'Passenger cars', traffic_volume: 30 }),
    ]);
  });
});
