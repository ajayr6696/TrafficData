import { describe, expect, it } from 'vitest';
import { buildCalculatedTrafficRows } from '../src/services/trafficNormalization.js';

describe('buildCalculatedTrafficRows', () => {
  it('returns no calculated rows when input is empty', () => {
    expect(buildCalculatedTrafficRows([])).toEqual([]);
  });

  it('rolls bus subcategories into calculated BUS total', () => {
    const rows = buildCalculatedTrafficRows([
      { country_code: 'FR', vehicle_id: 'BUS', year: 2022, traffic_volume: 10 },
      { country_code: 'FR', vehicle_id: 'BUS_TRO', year: 2022, traffic_volume: 5 },
      { country_code: 'FR', vehicle_id: 'MCO', year: 2022, traffic_volume: 2 },
    ]);

    expect(rows).toContainEqual(
      expect.objectContaining({
        vehicle_id: 'BUS',
        traffic_volume: 17,
        is_calculated: true,
      }),
    );
  });

  it('keeps separate country/year groups isolated', () => {
    const rows = buildCalculatedTrafficRows([
      { country_code: 'AT', vehicle_id: 'CAR', year: 2020, traffic_volume: 10 },
      { country_code: 'DE', vehicle_id: 'CAR', year: 2020, traffic_volume: 20 },
    ]);

    const atTotal = rows.find((row) => row.country_code === 'AT' && row.vehicle_id === 'TOTAL');
    const deTotal = rows.find((row) => row.country_code === 'DE' && row.vehicle_id === 'TOTAL');

    expect(atTotal?.traffic_volume).toBe(10);
    expect(deTotal?.traffic_volume).toBe(20);
  });
});
