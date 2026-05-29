import 'dotenv/config';
import { config } from '../src/constants/config.js';
import { ensureTrafficTable } from '../src/database/migrations.js';
import { closePool } from '../src/database/pool.js';
import { importTrafficCsv } from '../src/database/trafficDataImport.js';
import logger from '../src/logger/index.js';

const importCsv = async () => {
  const csvPath = process.env.CSV_PATH || config.csvPath;
  const shouldTruncate = process.argv.includes('--truncate');

  await ensureTrafficTable();

  const result = await importTrafficCsv({
    csvPath,
    logger,
    truncate: shouldTruncate,
    skipRawImportWhenPresent: !shouldTruncate,
  });

  logger.info(result, 'CSV import complete');
};

importCsv()
  .catch((error) => {
    logger.error({ err: error }, 'CSV import failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
