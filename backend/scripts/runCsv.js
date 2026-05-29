import { fileURLToPath } from 'node:url';

const rootCsvPath = fileURLToPath(new URL('../../road_tf_veh_linear_2_0 2 _ cleaned.csv', import.meta.url));

process.env.DATABASE_URL = '';
process.env.CSV_PATH = rootCsvPath;

await import('../src/index.js');
