import { TOTAL_VEHICLE_ID } from '../constants/config.js';
import {
  getVehicleMetadata,
  getUnidentifiedVehicleId,
  RAW_TOTAL_PARENT_VEHICLE_ID,
  TOP_LEVEL_VEHICLE_IDS,
} from '../constants/trafficMetadata.js';

const toNumber = (value) => Number(value || 0);

const rawOnly = (rows) => rows.filter((row) => !row.is_calculated);

const rowKey = (row) => `${row.country_code}:${row.year}`;

const makeCalculatedRow = ({ id, countryCode, vehicleId, year, trafficVolume }) => ({
  id,
  country_code: countryCode,
  vehicle_id: vehicleId,
  year,
  traffic_volume: trafficVolume,
  is_calculated: true,
});

export const withRawCalculationFlag = (row) => ({
  ...row,
  is_calculated: Boolean(row.is_calculated),
});

export const buildCalculatedTrafficRows = (rows, firstId = 1) => {
  const rawRows = rawOnly(rows).map(withRawCalculationFlag);
  const grouped = new Map();

  rawRows.forEach((row) => {
    const group = grouped.get(rowKey(row)) || {
      countryCode: row.country_code,
      year: row.year,
      absoluteTotal: 0,
      parentTotals: new Map(TOP_LEVEL_VEHICLE_IDS.map((vehicleId) => [vehicleId, 0])),
      unidentifiedTotals: new Map(TOP_LEVEL_VEHICLE_IDS.map((vehicleId) => [vehicleId, 0])),
    };
    const volume = toNumber(row.traffic_volume);
    const parentVehicleId = getVehicleMetadata(row.vehicle_id).parent_code;

    group.absoluteTotal += volume;

    if (row.vehicle_id === TOTAL_VEHICLE_ID) {
      group.parentTotals.set(
        RAW_TOTAL_PARENT_VEHICLE_ID,
        (group.parentTotals.get(RAW_TOTAL_PARENT_VEHICLE_ID) || 0) + volume,
      );
      group.unidentifiedTotals.set(
        RAW_TOTAL_PARENT_VEHICLE_ID,
        (group.unidentifiedTotals.get(RAW_TOTAL_PARENT_VEHICLE_ID) || 0) + volume,
      );
    } else if (TOP_LEVEL_VEHICLE_IDS.includes(row.vehicle_id)) {
      group.parentTotals.set(row.vehicle_id, (group.parentTotals.get(row.vehicle_id) || 0) + volume);
      group.unidentifiedTotals.set(
        row.vehicle_id,
        (group.unidentifiedTotals.get(row.vehicle_id) || 0) + volume,
      );
    } else if (parentVehicleId && group.parentTotals.has(parentVehicleId)) {
      group.parentTotals.set(parentVehicleId, (group.parentTotals.get(parentVehicleId) || 0) + volume);
    }

    grouped.set(rowKey(row), group);
  });

  let nextId = firstId;
  const calculatedRows = [];

  [...grouped.values()]
    .sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.year - b.year)
    .forEach((group) => {
      calculatedRows.push(makeCalculatedRow({
        id: nextId,
        countryCode: group.countryCode,
        vehicleId: TOTAL_VEHICLE_ID,
        year: group.year,
        trafficVolume: group.absoluteTotal,
      }));
      nextId += 1;

      TOP_LEVEL_VEHICLE_IDS.forEach((vehicleId) => {
        const unidentifiedTotal = group.unidentifiedTotals.get(vehicleId) || 0;
        const parentTotal = group.parentTotals.get(vehicleId) || 0;

        if (unidentifiedTotal) {
          calculatedRows.push(makeCalculatedRow({
            id: nextId,
            countryCode: group.countryCode,
            vehicleId: getUnidentifiedVehicleId(vehicleId),
            year: group.year,
            trafficVolume: unidentifiedTotal,
          }));
          nextId += 1;
        }

        if (parentTotal) {
          calculatedRows.push(makeCalculatedRow({
            id: nextId,
            countryCode: group.countryCode,
            vehicleId,
            year: group.year,
            trafficVolume: parentTotal,
          }));
          nextId += 1;
        }
      });
    });

  return calculatedRows;
};

export const normalizeTrafficRows = (rows) => {
  const rawRows = rows.map(withRawCalculationFlag);
  const maxId = rawRows.reduce((max, row) => Math.max(max, Number(row.id) || 0), 0);
  return [
    ...rawRows,
    ...buildCalculatedTrafficRows(rawRows, maxId + 1),
  ];
};
