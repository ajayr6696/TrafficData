import { query } from './pool.js';

export const ensureTrafficTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS traffic_data (
      id SERIAL PRIMARY KEY,
      country_code VARCHAR(16) NOT NULL,
      vehicle_id VARCHAR(64) NOT NULL,
      year INTEGER NOT NULL,
      traffic_volume NUMERIC NOT NULL,
      is_calculated BOOLEAN NOT NULL DEFAULT FALSE
    );
  `);

  await query(`
    ALTER TABLE traffic_data
    ADD COLUMN IF NOT EXISTS is_calculated BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_traffic_country_year
    ON traffic_data (country_code, year);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_traffic_vehicle_year
    ON traffic_data (vehicle_id, year);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_traffic_country_vehicle_year
    ON traffic_data (country_code, vehicle_id, year);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_traffic_calculated_country_vehicle_year
    ON traffic_data (is_calculated, country_code, vehicle_id, year);
  `);
};
