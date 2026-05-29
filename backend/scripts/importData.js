import 'dotenv/config';
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { config } from '../src/constants/config.js';
import { ensureTrafficTable } from '../src/database/migrations.js';
import { query, closePool } from '../src/database/pool.js';
import logger from '../src/logger/index.js';
import { buildCalculatedTrafficRows } from '../src/services/trafficNormalization.js';

const BATCH_SIZE = 1000;

const toRecord = (row) => ({
  vehicle_id: row.vehicle_id?.trim().toUpperCase(),
  country_code: row.country_code?.trim().toUpperCase(),
  year: Number(row.year),
  traffic_volume: Number(row.traffic_volume),
  is_calculated: false,
});

const mapDbRawRecord = (row) => ({
  vehicle_id: row.vehicle_id,
  country_code: row.country_code,
  year: Number(row.year),
  traffic_volume: Number(row.traffic_volume),
  is_calculated: false,
});

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

const importCsv = async () => {
  const csvPath = process.env.CSV_PATH || config.csvPath;
  const shouldTruncate = process.argv.includes('--truncate');
  let imported = 0;
  let calculatedImported = 0;
  let batch = [];

  await ensureTrafficTable();

  if (shouldTruncate) {
    await query('TRUNCATE TABLE traffic_data RESTART IDENTITY');
  } else {
    await query('DELETE FROM traffic_data WHERE is_calculated = TRUE');
  }

  const parser = fs
    .createReadStream(csvPath)
    .pipe(parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }));

  for await (const row of parser) {
    const record = toRecord(row);
    if (
      !record.country_code
      || !record.vehicle_id
      || !Number.isInteger(record.year)
      || Number.isNaN(record.traffic_volume)
    ) {
      continue;
    }

    batch.push(record);

    if (batch.length >= BATCH_SIZE) {
      await insertBatch(batch);
      imported += batch.length;
      batch = [];
      logger.info({ imported }, 'Imported traffic rows');
    }
  }

  await insertBatch(batch);
  imported += batch.length;

  const rawResult = await query(`
    SELECT country_code, vehicle_id, year, traffic_volume
    FROM traffic_data
    WHERE is_calculated = FALSE
  `);
  const calculatedRows = buildCalculatedTrafficRows(rawResult.rows.map(mapDbRawRecord));
  for (let index = 0; index < calculatedRows.length; index += BATCH_SIZE) {
    const calculatedBatch = calculatedRows.slice(index, index + BATCH_SIZE);
    await insertBatch(calculatedBatch);
    calculatedImported += calculatedBatch.length;
  }

  logger.info({ imported, calculatedImported, csvPath }, 'CSV import complete');
};

importCsv()
  .catch((error) => {
    logger.error({ err: error }, 'CSV import failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
