import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to run the backend with PostgreSQL.');
  process.exit(1);
}

await import('../src/index.js');
