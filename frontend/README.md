# Traffic Data Frontend

React + Vite dashboard for the traffic analytics assignment. The UI is responsive, filter-driven, and built with **Tailwind CSS**, **shadcn/ui-style components**, **Lucide** icons, and **Recharts** (via shadcn `chart` primitives).

**Live app (production):** opened through the root README — the browser tab uses the same **Activity** pulse icon as the “Traffic analytics” badge in the header (`/favicon.svg` + `BrandMark` component).

## How this folder was created

1. **Vite + React + TypeScript** scaffold (`npm create vite@latest` pattern).
2. **Tailwind CSS** added with `tailwind.config.ts` and `src/index.css` (CSS variables for theme colors).
3. **shadcn/ui** initialized via `components.json` (style: `default`, base color: `slate`, path alias `@/`).
4. UI primitives added under `src/components/ui/` (`button`, `card`, `badge`, `select`, `chart`, etc.) — copied/adapted from [shadcn/ui](https://ui.shadcn.com/) rather than a separate design system.
5. **Recharts** wired through `components/ui/chart.tsx` (`ChartContainer`, `ChartTooltipContent`) for consistent theming.
6. Feature folders added for charts, dashboard layout, API hooks, and shared utilities.

## Folder structure

```text
frontend/
  public/
    favicon.svg              # Browser tab icon (matches header Activity icon)
  src/
    components/
      BrandMark.tsx          # Shared Activity icon for header branding
      charts/                # One file per visualization (Recharts)
      dashboard/             # Dashboard shell, filters, chart cards
      ui/                    # shadcn-style primitives (Tailwind + Radix patterns)
    context/
      TrafficFiltersContext.tsx   # Global country / vehicle / year filters
    hooks/
      useTrafficQuery.ts     # Fetch + loading/error state for API calls
    lib/
      chartTransforms.ts     # Pivot helpers for stacked/area charts
      filterDefaults.ts      # Default country and year range from metadata
      format.ts              # Number formatting for axes and tooltips
      utils.ts               # cn() classname helper (shadcn convention)
    services/
      trafficApi.ts          # Typed wrappers around /api/traffic/*
    types/
      traffic.ts             # API response TypeScript types
    App.tsx
    main.tsx
    index.css
  components.json            # shadcn/ui generator config
  tailwind.config.ts
  vite.config.ts
```

## Tailwind CSS and shadcn/ui

| Piece | Role |
| --- | --- |
| **Tailwind** | Layout (`grid`, `flex`), spacing, typography, responsive breakpoints (`sm:`, `lg:`), and semantic colors (`bg-background`, `text-muted-foreground`). |
| **shadcn/ui** | Accessible building blocks in `components/ui/` — not a heavy npm UI kit; you own the source files. |
| **`cn()` utility** | Merges Tailwind classes (`clsx` + `tailwind-merge`) for variants. |
| **`ChartContainer`** | Wraps Recharts charts with theme-aware colors from `chartPalette.ts`. |

Charts do **not** use shadcn directly for drawing; they use **Recharts** (`BarChart`, `LineChart`, `PieChart`, `AreaChart`) inside shadcn `ChartContainer` for consistent tooltips and legends.

## Charts (assignment + extensions)

The assignment asks for **country-wise traffic** and **vehicle type distribution** (bar/line/pie). This app implements those plus additional views for exploration.

| Chart component | Type | What it shows |
| --- | --- | --- |
| `TopCountriesBar` | **Bar** | **Country-wise traffic** — top N countries for a selected year and vehicle class (default calculated `TOTAL`). |
| `TotalTrafficTrend` | **Line** | **Country-wise traffic over time** — total volume trend for one country between start/end years. |
| `VehicleDistributionDonut` | **Pie / donut** | **Vehicle type distribution** — share of parent vehicle classes (CAR, LOR, BUS, etc.) for one country and year. |
| `YearlyStackedTraffic` | **Stacked bar** | Vehicle mix by year for one country (stacked parent categories). |
| `CumulativeCompositionArea` (growth) | **Area** | Cumulative traffic growth by vehicle class over years. |
| `CumulativeCompositionArea` (mix) | **Area** | Cumulative composition / mix view for the same filters. |

Additional chart modules exist for deeper API endpoints (`CountryComparisonGrouped`, `VehicleDeepDiveBar`) and can be wired into the dashboard as needed; the main dashboard focuses on the six views above.

**Global filters** (`GlobalFilters.tsx` + `TrafficFiltersContext`) drive country, vehicle, and year range across charts. Metadata (`GET /api/traffic/filters`) supplies country list, 17 source vehicle codes, and per-country year ranges.

## Setup and run locally

```bash
cd frontend
npm install
copy .env.example .env   # Windows
npm run dev
```

- App: `http://localhost:5173`
- API default: `http://localhost:4000/api` (override with `VITE_API_BASE_URL` in `.env`)

```bash
npm run build    # production bundle
npm run preview  # serve build locally
npm test         # Vitest unit tests
```

## Tests

Tests live next to the code they cover and run in CI.

| File | What it verifies |
| --- | --- |
| `src/lib/chartTransforms.test.ts` | Pivoting long API rows into Recharts-friendly series; stable series key ordering. |
| `src/lib/format.test.ts` | Compact (`1.5M`) and full (`7,494,046`) number formatting for chart axes. |
| `src/lib/filterDefaults.test.ts` | Inclusive year ranges, default country selection, per-country year bounds. |

```bash
npm test
```

## Build and Docker

Production build is static files served by Nginx in `frontend/Dockerfile`. The image receives `VITE_API_BASE_URL=/api` at build time so the browser calls the same host through the Nginx `/api` proxy.
