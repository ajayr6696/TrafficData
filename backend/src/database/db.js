import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
const shouldUseSsl = Boolean(connectionString) && connectionString.includes('supabase.co');
const options = {
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  onnotice: () => {},
};

const sql = connectionString
  ? postgres(connectionString, options)
  : postgres(options);

export default sql;
