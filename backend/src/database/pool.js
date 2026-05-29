import pg from 'pg';
import { config } from '../constants/config.js';

const { Pool } = pg;

const pool = new Pool(
  config.databaseUrl
    ? { connectionString: config.databaseUrl }
    : undefined,
);

export const query = (text, params) => pool.query(text, params);

export const closePool = () => pool.end();

export default pool;
