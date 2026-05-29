# Traffic Data Dashboard

Full-stack traffic analysis dashboard with a Node.js API, PostgreSQL storage, and a React charting UI.

## Project Structure

```text
D:\TrafficData
├── backend
│   ├── scripts
│   └── src
│       ├── controllers
│       ├── database
│       ├── dto
│       ├── middlewares
│       ├── repositories
│       ├── routes
│       ├── schemas
│       └── services
├── frontend
│   └── src
│       ├── components
│       ├── context
│       ├── hooks
│       ├── lib
│       ├── services
│       └── types
└── docker-compose.yml
```

## Quick Start

For the current local-debug mode, the backend reads directly from the provided CSV file. PostgreSQL startup code is intentionally commented out, so no database or import step is required.

Start the backend:

```bash
cd D:\TrafficData\backend
npm install
copy .env.example .env
npm run dev
```

Start the frontend in another terminal:

```bash
cd D:\TrafficData\frontend
npm install
copy .env.example .env
npm run dev
```

Manual local setup is documented in [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## Debug Commands

Backend:

```bash
cd D:\TrafficData\backend
npm run dev
npm run debug
npm run debug:watch
```

Frontend:

```bash
cd D:\TrafficData\frontend
npm run dev
npm run debug
```

## Architecture

The backend is a stateless Express API. Controllers validate requests with AJV schemas, DTOs normalize query/body values, services own business logic, and repositories isolate the data source. For now, the active repository parses the CSV file into memory on startup and applies the same calculated-row normalization used by the PostgreSQL import path. The PostgreSQL repository is still present for later re-enablement. The `TrafficService` is the source of truth for chart semantics:

- Trend and growth total charts use calculated absolute `vehicle_id = 'TOTAL'` rows.
- Country ranking defaults to the calculated absolute total.
- Raw `vehicle_id = 'TOTAL'` is treated as `Other unidentified vehicles` everywhere except the calculated-total views.
- Parent composition charts use calculated parent totals, with raw parent values represented as unidentified child buckets.
- Main category formulas are calculated per country/year, for example `LOR = LOR + LOR_LE3P5 + LOR_GT3P5-6 + LOR_GT6 + TRC` and `BUS = BUS_MCO_TRO + BUS_MCO_MIN + BUS + BUS_TRO + MCO`.
- The dashboard opens with Cumulative growth first. The top summary shows 17 source vehicle categories and all countries; hovering those stats lists the categories or countries.

The frontend is a Vite React application using Tailwind CSS, shadcn-style UI primitives, and Recharts chart components. Global dashboard filters are stored in React Context and passed to API services.

## Scaling Path

At 5 RPS, a single API instance with a cached CSV dataset is sufficient for local/debug usage.

At 50 RPS, run multiple API replicas behind a load balancer and cache high-traffic chart responses.

At 500 RPS, re-enable PostgreSQL, add read replicas, Redis caching, materialized aggregate views by country/year/vehicle, autoscaling API containers, and query tracing/slow-query alerts.

## Tests

```bash
cd D:\TrafficData\backend
npm test

cd D:\TrafficData\frontend
npm test
```
