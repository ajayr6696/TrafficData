import { describe, expect, it } from 'vitest';
import { getSeriesKeys, pivotByYear } from './chartTransforms';

describe('chartTransforms', () => {
  it('pivots long vehicle rows by year', () => {
    const rows = [
      { year: 2020, vehicle_id: 'CAR', traffic_volume: 10 },
      { year: 2020, vehicle_id: 'BUS', traffic_volume: 4 },
      { year: 2021, vehicle_id: 'CAR', traffic_volume: 12 },
    ];

    expect(pivotByYear(rows, 'vehicle_id')).toEqual([
      { year: 2020, CAR: 10, BUS: 4 },
      { year: 2021, CAR: 12 },
    ]);
  });

  it('returns sorted series keys', () => {
    const rows = [
      { vehicle_id: 'TRUCK' },
      { vehicle_id: 'CAR' },
      { vehicle_id: 'TRUCK' },
    ];

    expect(getSeriesKeys(rows, 'vehicle_id')).toEqual(['CAR', 'TRUCK']);
  });
});
