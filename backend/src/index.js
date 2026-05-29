import app from './app.js';
import { config } from './constants/config.js';
import { ensureTrafficTable } from './database/migrations.js';
import { seedTrafficDataIfNeeded } from './database/trafficDataImport.js';
import logger from './logger/index.js';

const startServer = async () => {
  if (config.databaseUrl) {
    await ensureTrafficTable();
    const seedResult = await seedTrafficDataIfNeeded({ logger });
    if (seedResult.seeded) {
      logger.info(seedResult, 'Traffic data seed complete');
    }
  }

  app.listen(config.port, () => {
    logger.info(`Traffic API listening on port ${config.port}`);
  });
};

startServer().catch((error) => {
  logger.error({ err: error }, 'Failed to start API');
  process.exit(1);
});
