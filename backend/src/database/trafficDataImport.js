import fs from 'node:fs';
import { parse } from 'csv-parse';
import { config } from '../constants/config.js';
import { buildCalculatedTrafficRows } from '../services/trafficNormalization.js';
import { query } from './pool.js';

const BATCH_SIZE = 1000;

const toRecord = (row) => ({
  vehicle_id: row.vehicle_id?.trim().toUpperCase(),
  country_code: row.country_code?.trim().toUpperCase(),
  year: Number(row.year),
  traffic_volume: Number(row.traffic_volume),
  is_calculated: false,
});

const isValidRecord = (record) => (
  record.country_code
  && record.vehicle_id
  && Number.isInteger(record.year)
  && !Number.isNaN(record.traffic_volume)
);

const mapDbRawRecord = (row) => ({
  vehicle_id: row.vehicle_id,
  country_code: row.country_code,
  year: Number(row.year),
  traffic_volume: Number(row.traffic_volume),
  is_calculated: false,
});

export const getTrafficTableCounts = async () => {
  const result = await query(`
    SELECT
      COUNT(*)::integer AS total_rows,
      COUNT(*) FILTER (WHERE is_calculated = FALSE)::integer AS raw_rows,
      COUNT(*) FILTER (WHERE is_calculated = TRUE)::integer AS calculated_rows
    FROM traffic_data
  `);

  const row = result.rows[0] || {};
  return {
    totalRows: Number(row.total_rows || 0),
    rawRows: Number(row.raw_rows || 0),
    calculatedRows: Number(row.calculated_rows || 0),
  };
};

const insertBatch = async (records) => {
  if (!records.length) {
    return;
  }

  const placeholders = records
    .map((_, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    })
    .join(',');
  const values = records.flatMap((record) => [
    record.country_code,
    record.vehicle_id,
    record.year,
    record.traffic_volume,
    Boolean(record.is_calculated),
  ]);

  await query(
    `
      INSERT INTO traffic_data (country_code, vehicle_id, year, traffic_volume, is_calculated)
      VALUES ${placeholders}
    `,
    values,
  );
};

export const importRawTrafficRowsFromCsv = async ({ csvPath = config.csvPath, logger } = {}) => {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file was not found at ${csvPath}`);
  }

  let imported = 0;
  let batch = [];

  const parser = fs
    .createReadStream(csvPath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }));

  for await (const row of parser) {
    const record = toRecord(row);
    if (!isValidRecord(record)) {
      continue;
    }

    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      imported += batch.length;
      batch = [];
      logger?.info({ imported }, 'Imported traffic rows');
    }
  }

  await insertBatch(batch);
  imported += batch.length;
  return imported;
};

export const rebuildCalculatedTrafficRows = async () => {
  await query('DELETE FROM traffic_data WHERE is_calculated = TRUE');

  const rawResult = await query(`
    SELECT country_code, vehicle_id, year, traffic_volume
    FROM traffic_data
    WHERE is_calculated = FALSE
  `);
  const calculatedRows = buildCalculatedTrafficRows(rawResult.rows.map(mapDbRawRecord));

  for (let index = 0; index < calculatedRows.length; index += BATCH_SIZE) {
    await insertBatch(calculatedRows.slice(index, index + BATCH_SIZE));
  }

  return calculatedRows.length;
};

export const importTrafficCsv = async ({
  csvPath = config.csvPath,
  logger,
  skipRawImportWhenPresent = true,
  truncate = false,
} = {}) => {
  if (truncate) {
    await query('TRUNCATE TABLE traffic_data RESTART IDENTITY');
  }

  const counts = await getTrafficTableCounts();
  const shouldImportRaw = !skipRawImportWhenPresent || counts.rawRows === 0;
  const imported = shouldImportRaw
    ? await importRawTrafficRowsFromCsv({ csvPath, logger })
    : 0;

  if (!shouldImportRaw) {
    logger?.info({ rawRows: counts.rawRows }, 'Raw traffic rows already exist; rebuilding calculated rows only');
  }

  const calculatedImported = await rebuildCalculatedTrafficRows();

  return {
    imported,
    calculatedImported,
    csvPath,
  };
};

export const seedTrafficDataIfNeeded = async ({ csvPath = config.csvPath, logger } = {}) => {
  const counts = await getTrafficTableCounts();

  if (counts.totalRows > 0 && counts.calculatedRows > 0) {
    return {
      seeded: false,
      reason: 'table-has-data',
      ...counts,
    };
  }

  if (!fs.existsSync(csvPath)) {
    logger?.warn({ csvPath, ...counts }, 'Traffic table has no chart-ready data and CSV seed file was not found');
    return {
      seeded: false,
      reason: 'missing-csv',
      ...counts,
    };
  }

  if (counts.totalRows === 0) {
    logger?.info({ csvPath }, 'Traffic table is empty; importing CSV seed data');
    const result = await importTrafficCsv({
      csvPath,
      logger,
      skipRawImportWhenPresent: false,
    });

    return {
      seeded: true,
      reason: 'empty-table',
      ...result,
    };
  }

  if (counts.rawRows > 0 && counts.calculatedRows === 0) {
    logger?.info({ rawRows: counts.rawRows }, 'Traffic table is missing calculated rows; rebuilding them');
    const calculatedImported = await rebuildCalculatedTrafficRows();

    return {
      seeded: true,
      reason: 'missing-calculated-rows',
      imported: 0,
      calculatedImported,
      csvPath,
    };
  }

  return {
    seeded: false,
    reason: 'no-raw-data',
    ...counts,
  };
};
