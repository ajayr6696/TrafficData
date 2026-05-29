# Traffic Data Frontend

React + Vite dashboard for traffic analytics. It uses Tailwind CSS, shadcn-style UI components, and Recharts through shadcn chart primitives.

## Setup

```bash
cd D:\TrafficData\frontend
npm install
copy .env.example .env
npm run dev
```

The app runs at `http://localhost:5173` and expects the backend at `http://localhost:4000/api` unless `VITE_API_BASE_URL` is changed.

## Debug Commands

```bash
# Run the Vite dev server
npm run dev

# Run Vite on the explicit local debugging host/port
npm run debug

# Build for production
npm run build
```

## Dashboard

The UI exposes global filters for country, vehicle type, start year, and end year. Six charts are rendered from backend aggregation endpoints and the dashboard opens with Cumulative growth first:

- Cumulative growth area chart
- Total traffic trend line chart
- Top 10 countries bar chart
- Vehicle distribution donut chart
- Yearly stacked vehicle mix
- Cumulative composition area chart

The summary row at the top shows 17 source vehicle categories and the full country list is available on hover.

## Tests

```bash
npm test
```

## Build

```bash
npm run build
npm run preview
```
