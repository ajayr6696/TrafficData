import 'dotenv/config';

const toList = (value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  frontendOrigins: toList(process.env.FRONTEND_ORIGIN || 'http://localhost:5173'),
  csvPath: process.env.CSV_PATH || 'D:\\road_tf_veh_linear_2_0 2 _ cleaned.csv',
};

export const TOTAL_VEHICLE_ID = 'TOTAL';
