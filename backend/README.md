# Traffic Data Backend

Node.js + **Express** API for the traffic analytics assignment. Data is stored in **PostgreSQL** when `DATABASE_URL` is set; a **CSV repository** is available for local debugging without a database.

**Dataset:** [Eurostat `road_tf_veh`](https://ec.europa.eu/eurostat/databrowser/view/road_tf_veh/default/table?lang=en) (million vehicle-kilometres by country, year, and vehicle type). See root `README.md` for source rationale.

## How this folder was created

1. **Express** app with ES modules (`"type": "module"` in `package.json`).
2. Layered layout: **routes → controllers → services → repositories** (plus DTOs and AJV schemas).
3. **PostgreSQL** access via `postgres` (`src/database/db.js`, `pool.js`) with startup migrations.
4. **CSV import** and calculated-row pipeline in `trafficDataImport.js` + `trafficNormalization.js`.
5. **Vitest** for unit tests on business logic (no DB required for most tests).

## Folder structure

```text
backend/
  scripts/
    importData.js           # CLI: import CSV into PostgreSQL (--truncate optional)
    runCsv.js               # Dev server using CSV repository only
    runPostgres.js          # Dev server using DATABASE_URL
  src/
    controllers/            # HTTP handlers
    database/
      db.js                 # postgres.js client (Supabase SSL when URL contains supabase.co)
      migrations.js         # CREATE TABLE traffic_data + indexes
      trafficDataImport.js  # CSV seed, batch insert, recalculate aggregates
      pool.js               # query() wrapper
    dto/                    # Request/response shaping
    middlewares/            # AJV validation, errors, 404
    repositories/
      traffic.repository.js # PostgreSQL queries for charts and CRUD
      csvTraffic.repository.js
    routes/
      traffic.js            # /api/traffic/*
    schemas/                # JSON Schema (AJV) for query/body validation
    services/
      traffic.service.js    # Chart semantics, labels, aggregation rules
      trafficNormalization.js
    constants/
      config.js
      trafficMetadata.js    # Country names, vehicle labels, hierarchy
    app.js
    index.js                # Start server, migrate, seed if empty
  tests/
    traffic.service.test.js
    trafficNormalization.test.js
```

## Database

### Table: `traffic_data`

| Column | Type | Description |
| --- | --- | --- |
| `id` | `SERIAL` | Primary key |
| `country_code` | `VARCHAR(16)` | e.g. `AT`, `DE`, `UK` |
| `vehicle_id` | `VARCHAR(64)` | Raw or calculated vehicle code |
| `year` | `INTEGER` | Reporting year (2011-2024 in dataset) |
| `traffic_volume` | `NUMERIC` | Volume used in charts |
| `is_calculated` | `BOOLEAN` | `false` = raw CSV row; `true` = derived chart row |

Indexes exist on `(country_code, year)`, `(vehicle_id, year)`, `(country_code, vehicle_id, year)`, and a partial-friendly composite including `is_calculated`.

### Countries in the dataset (32)

AT, BE, BG, CH, CY, CZ, DE, DK, EE, ES, FI, FR, GE, HR, HU, IE, IS, IT, LT, LV, MK, MT, NL, NO, PL, PT, RO, SE, SI, TR, UA, UK  - labels in `trafficMetadata.js`.

### Source vehicle codes in CSV (17)

`BIKE`, `BUS`, `BUS_MCO_MIN`, `BUS_MCO_TRO`, `BUS_TRO`, `CAR`, `LOR`, `LOR_GT3P5-6`, `LOR_GT6`, `LOR_LE3P5`, `MCO`, `MOP`, `MOTO`, `MOTO_MOP`, `RDMVEH_OTH`, `TOTAL`, `TRC`.

Calculated parent rows (e.g. rolled-up `LOR`, `BUS`, chart `TOTAL`) are stored with `is_calculated = true`. See root `README.md` for normalization rules.

### Supabase PostgreSQL

The deployed Node.js API connects directly to [Supabase](https://supabase.com/) using `DATABASE_URL`. Local Docker Postgres is only for local development if you want it.

1. Create a project → **Settings → Database** → copy the connection string (pooler port `6543` is fine for the API).
2. Set in `backend/.env`:

```env
DATABASE_URL=postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

3. `src/database/db.js` enables SSL automatically when the host contains `supabase.co`.
4. Import data once from your machine:

```bash
npm run import:data -- --truncate
```

**Production on AWS:** EC2 runs only the backend and frontend containers. PostgreSQL is Supabase, reached by the Node.js server through `DATABASE_URL`.

## API (assignment: deliver traffic data + updates)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/traffic/filters` | Countries, vehicles, year ranges |
| `GET` | `/api/traffic` | Filtered raw rows |
| `GET` | `/api/traffic/trend` | Country total trend (line chart) |
| `GET` | `/api/traffic/top-countries` | Country ranking (bar chart) |
| `GET` | `/api/traffic/distribution` | Vehicle share (pie/donut) |
| `GET` | `/api/traffic/stacked` | Yearly stacked mix |
| `GET` | `/api/traffic/cumulative` | Cumulative composition |
| `POST` | `/api/traffic` | Create raw row (recalculates aggregates in PG mode) |
| `PUT` | `/api/traffic/:id` | Update raw row |
| `DELETE` | `/api/traffic/:id` | Delete raw row |

Aggregate reads use calculated `TOTAL` and parent vehicle IDs; raw `TOTAL` in CSV means “other unidentified vehicles” in distribution views.

## Setup and run locally

```bash
cd backend
npm install
copy .env.example .env
```

**Option A  - PostgreSQL (recommended, matches assignment)**

```bash
# Start Postgres (Docker Compose from repo root, or Supabase DATABASE_URL in .env)
npm run dev:postgres
```

**Option B  - CSV only (no database)**

```bash
npm run dev:csv
```

API: `http://localhost:4000`

**Import CSV into PostgreSQL**

```bash
set DATABASE_URL=postgres://...
set CSV_PATH=D:\TrafficData\road_tf_veh_linear_2_0 2 _ cleaned.csv
npm run import:data -- --truncate
```

## Tests

| File | What it verifies |
| --- | --- |
| `tests/traffic.service.test.js` | Service calls repositories with correct `vehicle_id` / `is_calculated` flags; cumulative composition math; deep-dive vehicle lists. |
| `tests/trafficNormalization.test.js` | Empty input, BUS rollups, per-country isolation in calculated rows. |
| `tests/traffic.service.test.js` (existing) | Core chart semantics aligned with `buildCalculatedTrafficRows`. |

```bash
npm test
```

Tests use **Vitest** and **mocked repositories**  - no live PostgreSQL required in CI.

## Scaling (assignment requirement)

| Load | Approach |
| --- | --- |
| **5 RPS** | Single API process + single PostgreSQL; indexes from migrations. |
| **50 RPS** | Multiple API instances behind a load balancer; cache hot filter queries; managed Postgres backups. |
| **500 RPS** | ECS/Fargate or Kubernetes; read replicas; Redis for aggregate cache; materialized views; autoscaling and tracing. |

See root `README.md` for CI/CD and future improvements (Lambda, SQS, Terraform, etc.).
