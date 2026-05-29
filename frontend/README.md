# Traffic Data Frontend

React + Vite dashboard for the traffic analytics assignment. Layout and UI chrome use **Tailwind CSS** and **shadcn/ui-style** components; **all graphs are drawn with [Recharts](https://recharts.org/)** (not Chart.js, D3, or a separate chart CSS framework).

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

## Charts: which library and which CSS?

This is the stack used for **every** visualization on the dashboard:

| Layer | Technology | Role |
| --- | --- | --- |
| **Chart rendering library** | **[Recharts](https://recharts.org/)** (`recharts` on npm) | Draws bars, lines, pie/donut, stacked bars, and areas. Components used include `BarChart`, `LineChart`, `PieChart`, `AreaChart`, `ResponsiveContainer`, `CartesianGrid`, `XAxis`, `YAxis`, `Tooltip`, `Legend`. |
| **Chart styling** | **Recharts props + Tailwind on wrappers** | Series colors come from `src/components/charts/chartPalette.ts` and CSS variables (`--chart-1` … `--chart-5` in `src/index.css`). Recharts sets SVG fill/stroke via its `fill` props; there is **no** separate chart-only CSS file (e.g. not Chart.js CSS). |
| **Tooltip / legend shell** | **Custom shadcn-style helpers** in `src/components/ui/chart.tsx` | `ChartContainer` (height/layout) and `ChartTooltipContent` (themed tooltip HTML). These are **not** a second chart library — they wrap Recharts tooltips. |
| **Page layout around charts** | **Tailwind CSS v4** (`@tailwindcss/vite`) | Cards, grids, filters, typography (`ChartCard`, `dashboard/`, `components/ui/card.tsx`). |
| **UI primitives (non-chart)** | **shadcn/ui pattern** + **Radix Slot** | Buttons, selects, badges — copied into `components/ui/`; unrelated to plotting. |

**Summary:** Interactive graphs = **Recharts**. Page look-and-feel = **Tailwind CSS**. Tooltips/legend chrome = lightweight **chart.tsx** helpers inspired by [shadcn/ui charts](https://ui.shadcn.com/charts).

Example import pattern (from `TopCountriesBar.tsx`):

```tsx
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
```

## Tailwind CSS and shadcn/ui (non-chart UI)

| Piece | Role |
| --- | --- |
| **Tailwind** | Layout (`grid`, `flex`), spacing, typography, responsive breakpoints (`sm:`, `lg:`), and semantic colors (`bg-background`, `text-muted-foreground`). |
| **shadcn/ui** | Accessible building blocks in `components/ui/` — not a heavy npm UI kit; you own the source files. |
| **`cn()` utility** | Merges Tailwind classes (`clsx` + `tailwind-merge`) for variants. |

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
