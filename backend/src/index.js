import app from './app.js';
import { config } from './constants/config.js';
// PostgreSQL connection disabled for CSV-backed local debugging.
// import { ensureTrafficTable } from './database/migrations.js';
import logger from './logger/index.js';

const startServer = async () => {
  // PostgreSQL connection disabled for CSV-backed local debugging.
  // await ensureTrafficTable();

  app.listen(config.port, () => {
    logger.info(`Traffic API listening on port ${config.port}`);
  });
};

startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start API');
  process.exit(1);
});
