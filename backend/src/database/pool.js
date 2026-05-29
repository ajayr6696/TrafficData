import sql from './db.js';

export const query = async (text, params = []) => {
  const rows = await sql.unsafe(text, params);
  return {
    rows,
    rowCount: rows.length,
  };
};

export const closePool = () => sql.end();

export default sql;
