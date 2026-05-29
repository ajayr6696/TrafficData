# Traffic Data Backend

Node.js + Express API for traffic analytics. For the current local-debug mode, the API reads directly from the CSV file at `D:\road_tf_veh_linear_2_0 2 _ cleaned.csv`. PostgreSQL startup wiring is commented out in `src/index.js` and the service is temporarily wired to the CSV repository.

CSV rows are normalized in memory when the API first loads the data. PostgreSQL imports use the same calculated-row normalization.

## Setup

```bash
cd D:\TrafficData\backend
npm install
copy .env.example .env
```

Update `CSV_PATH` in `.env` only if your CSV is in a different location.

```bash
npm run dev
```

The API runs at `http://localhost:4000`.

## Debug Commands

```bash
# Run with automatic restart
npm run dev

# Run once with the Node debugger on chrome://inspect
npm run debug

# Run with debugger and automatic restart
npm run debug:watch
```

## CSV Data Source

The CSV must have these columns:

```text
vehicle_id,country_code,year,traffic_volume
```

The API assigns in-memory row IDs when it loads the CSV. `POST`, `PUT`, and `DELETE` mutate the in-memory dataset for the current server process; restarting the backend reloads from the CSV file.

## PostgreSQL Table For Later

```sql
CREATE TABLE traffic_data (
  id SERIAL PRIMARY KEY,
  country_code VARCHAR(16) NOT NULL,
  vehicle_id VARCHAR(64) NOT NULL,
  year INTEGER NOT NULL,
  traffic_volume NUMERIC NOT NULL,
  is_calculated BOOLEAN NOT NULL DEFAULT FALSE
);
```

When PostgreSQL is re-enabled, indexes are created automatically on startup/import for country, vehicle, and year filters.

## API

- `GET /api/health`
- `GET /api/traffic/filters`
- `GET /api/traffic?country_code=AT&vehicle_id=CAR&start_year=2015&end_year=2020`
- `POST /api/traffic`
- `PUT /api/traffic/:id`
- `DELETE /api/traffic/:id`
- `GET /api/traffic/trend?country_code=AT&start_year=2015&end_year=2020`
- `GET /api/traffic/top-countries?year=2020&limit=10`
- `GET /api/traffic/distribution?country_code=AT&year=2020`
- `GET /api/traffic/stacked?country_code=AT&start_year=2015&end_year=2020`
- `GET /api/traffic/compare?country_a=AT&country_b=FI&start_year=2015&end_year=2020`
- `GET /api/traffic/cumulative?country_code=AT&start_year=2015&end_year=2020`

Aggregate trend endpoints and the default country ranking use calculated `vehicle_id = 'TOTAL'` rows. Raw `vehicle_id = 'TOTAL'` is treated as `Other unidentified vehicles` everywhere else.

Normalization rules:

- Every raw row remains available with `is_calculated = false`.
- For each country/year, the calculated absolute total is inserted as `vehicle_id = 'TOTAL'` with `is_calculated = true`.
- Raw parent rows are preserved as unidentified child buckets for their parent class.
- Raw `TOTAL` rows are preserved as `Other unidentified vehicles` under `RDMVEH_OTH`.
- Calculated parent rows are inserted with `is_calculated = true`, for example `LOR = LOR + LOR_LE3P5 + LOR_GT3P5-6 + LOR_GT6 + TRC` and `BUS = BUS_MCO_TRO + BUS_MCO_MIN + BUS + BUS_TRO + MCO`.
- The frontend source-category stat uses the 17 raw CSV vehicle categories and exposes the full list on hover.

## Tests

```bash
npm test
```

## Scaling Notes

At 5 RPS in CSV mode, one API instance with an in-memory parsed CSV cache is sufficient. At 50 RPS, keep the API stateless and add response caching for common chart filters. At 500 RPS, re-enable PostgreSQL, add read replicas, Redis caching for dashboard aggregates, precomputed materialized views by year/country/vehicle, horizontal API autoscaling, and query-level observability to keep slow aggregations visible.
