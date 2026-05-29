import { query } from '../database/pool.js';
import { TOTAL_VEHICLE_ID } from '../constants/config.js';

const asNumber = (value) => Number(value || 0);

const mapTrafficRow = (row) => ({
  ...row,
  year: Number(row.year),
  traffic_volume: asNumber(row.traffic_volume),
  is_calculated: Boolean(row.is_calculated),
});

const addCondition = (conditions, values, sql, value) => {
  values.push(value);
  conditions.push(sql.replace('?', `$${values.length}`));
};

const buildWhereClause = (filters = {}) => {
  const values = [];
  const conditions = [];

  if (filters.countryCodes?.length) {
    addCondition(conditions, values, 'country_code = ANY(?)', filters.countryCodes);
  } else if (filters.country_code) {
    addCondition(conditions, values, 'country_code = ?', filters.country_code);
  }

  if (filters.vehicle_id) {
    addCondition(conditions, values, 'vehicle_id = ?', filters.vehicle_id);
  }

  if (filters.vehicleIds?.length) {
    addCondition(conditions, values, 'vehicle_id = ANY(?)', filters.vehicleIds);
  }

  if (filters.excludeVehicleId) {
    addCondition(conditions, values, 'vehicle_id <> ?', filters.excludeVehicleId);
  }

  if (filters.excludeVehicleIds?.length) {
    addCondition(conditions, values, 'NOT (vehicle_id = ANY(?))', filters.excludeVehicleIds);
  }

  if (typeof filters.isCalculated === 'boolean') {
    addCondition(conditions, values, 'is_calculated = ?', filters.isCalculated);
  }

  if (filters.year) {
    addCondition(conditions, values, 'year = ?', filters.year);
  }

  if (filters.start_year) {
    addCondition(conditions, values, 'year >= ?', filters.start_year);
  }

  if (filters.end_year) {
    addCondition(conditions, values, 'year <= ?', filters.end_year);
  }

  return {
    values,
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
  };
};

export class TrafficRepository {
  async getAvailableFilters() {
    const [countries, vehicleTypes, sourceVehicleTypes, years, countryYears] = await Promise.all([
      query('SELECT DISTINCT country_code FROM traffic_data ORDER BY country_code'),
      query('SELECT DISTINCT vehicle_id FROM traffic_data ORDER BY vehicle_id'),
      query('SELECT DISTINCT vehicle_id FROM traffic_data WHERE is_calculated = FALSE ORDER BY vehicle_id'),
      query('SELECT MIN(year) AS min_year, MAX(year) AS max_year FROM traffic_data'),
      query(`
        SELECT country_code, MIN(year) AS min_year, MAX(year) AS max_year
        FROM traffic_data
        GROUP BY country_code
      `),
    ]);

    return {
      countries: countries.rows.map((row) => row.country_code),
      vehicleTypes: vehicleTypes.rows.map((row) => row.vehicle_id),
      sourceVehicleTypes: sourceVehicleTypes.rows.map((row) => row.vehicle_id),
      yearRange: {
        min: years.rows[0]?.min_year ? Number(years.rows[0].min_year) : null,
        max: years.rows[0]?.max_year ? Number(years.rows[0].max_year) : null,
      },
      countryYearRanges: Object.fromEntries(countryYears.rows.map((row) => [
        row.country_code,
        {
          min: Number(row.min_year),
          max: Number(row.max_year),
        },
      ])),
    };
  }

  async list(filters = {}) {
    const { where, values } = buildWhereClause(filters);
    const limit = filters.limit || 500;
    const offset = filters.offset || 0;
    values.push(limit, offset);

    const result = await query(
      `
        SELECT id, country_code, vehicle_id, year, traffic_volume, is_calculated
        FROM traffic_data
        ${where}
        ORDER BY country_code, vehicle_id, year, id
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `,
      values,
    );

    return result.rows.map(mapTrafficRow);
  }

  async create(payload) {
    const result = await query(
      `
        INSERT INTO traffic_data (country_code, vehicle_id, year, traffic_volume, is_calculated)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, country_code, vehicle_id, year, traffic_volume, is_calculated
      `,
      [
        payload.country_code,
        payload.vehicle_id,
        payload.year,
        payload.traffic_volume,
        Boolean(payload.is_calculated),
      ],
    );

    return mapTrafficRow(result.rows[0]);
  }

  async update(id, payload) {
    const assignments = [];
    const values = [];

    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) {
        values.push(value);
        assignments.push(`${key} = $${values.length}`);
      }
    });

    values.push(id);
    const result = await query(
      `
        UPDATE traffic_data
        SET ${assignments.join(', ')}
        WHERE id = $${values.length}
        RETURNING id, country_code, vehicle_id, year, traffic_volume, is_calculated
      `,
      values,
    );

    return result.rows[0] ? mapTrafficRow(result.rows[0]) : null;
  }

  async remove(id) {
    const result = await query(
      'DELETE FROM traffic_data WHERE id = $1 RETURNING id',
      [id],
    );

    return Boolean(result.rowCount);
  }

  async getYearTotals(filters = {}) {
    const { where, values } = buildWhereClause(filters);
    const result = await query(
      `
        SELECT year, SUM(traffic_volume)::double precision AS traffic_volume
        FROM traffic_data
        ${where}
        GROUP BY year
        ORDER BY year
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...mapTrafficRow(row),
      is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
    }));
  }

  async getCountryTotals(filters = {}) {
    const { where, values } = buildWhereClause(filters);
    const limit = filters.limit || 10;
    values.push(limit);

    const result = await query(
      `
        SELECT country_code, SUM(traffic_volume)::double precision AS traffic_volume
        FROM traffic_data
        ${where}
        GROUP BY country_code
        ORDER BY traffic_volume DESC
        LIMIT $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => ({
      country_code: row.country_code,
      traffic_volume: asNumber(row.traffic_volume),
      is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
    }));
  }

  async getVehicleTotals(filters = {}) {
    const { where, values } = buildWhereClause(filters);
    const result = await query(
      `
        SELECT vehicle_id, SUM(traffic_volume)::double precision AS traffic_volume
        FROM traffic_data
        ${where}
        GROUP BY vehicle_id
        ORDER BY traffic_volume DESC
      `,
      values,
    );

    return result.rows.map((row) => ({
      vehicle_id: row.vehicle_id,
      traffic_volume: asNumber(row.traffic_volume),
      is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
    }));
  }

  async getVehicleYearTotals(filters = {}) {
    const { where, values } = buildWhereClause(filters);
    const result = await query(
      `
        SELECT year, vehicle_id, SUM(traffic_volume)::double precision AS traffic_volume
        FROM traffic_data
        ${where}
        GROUP BY year, vehicle_id
        ORDER BY year, vehicle_id
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...mapTrafficRow(row),
      is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
    }));
  }

  async getCountryYearTotals(filters = {}) {
    const { where, values } = buildWhereClause(filters);
    const result = await query(
      `
        SELECT year, country_code, SUM(traffic_volume)::double precision AS traffic_volume
        FROM traffic_data
        ${where}
        GROUP BY year, country_code
        ORDER BY year, country_code
      `,
      values,
    );

    return result.rows.map((row) => ({
      ...mapTrafficRow(row),
      is_calculated: typeof filters.isCalculated === 'boolean' ? filters.isCalculated : undefined,
    }));
  }
}

export const trafficRepository = new TrafficRepository();
export { TOTAL_VEHICLE_ID };
