# RideProfit

A standalone web app that tells you, before you accept or counter-offer an
inDrive ride, whether it's actually profitable — based on your car's real
fuel consumption, tolls, return-trip conditions, maintenance/depreciation
costs and desired profit.

This is **not** an inDrive integration. It never reads from or writes to
the inDrive app. You read the offer off your phone and type it in here.

## Stack

- **Next.js 16** (App Router, TypeScript) — one codebase for frontend + API
- **Tailwind CSS v4** — styling
- **Prisma + SQLite** (`prisma/dev.db`) — zero-setup local database
- **Vitest** — unit tests for the calculation engine
- **Recharts** — dashboard charts

### Architecture

```
Frontend (React pages)
    ↓ fetch()
API routes (src/app/api/**)        — validation (zod) + persistence only
    ↓
Business layer (src/lib/calculator.ts)   — ALL profitability formulas live here
    ↓
Persistence (Prisma / SQLite)
```

`src/lib/calculator.ts` exports `calculateTripProfitability()` — a pure,
framework-free function with no I/O. It's the single source of truth for
every formula in the app (fuel cost, tolls, return-trip handling, break-even
price, target price, status, profit/km, profit/hour, etc.). API routes call
it and return its output verbatim; **the frontend never recomputes a
number** — it only renders what the backend returns. This keeps the UI and
the backend mathematically identical by construction, and makes the engine
trivially unit-testable (see `tests/calculator.test.ts`).

`src/lib/tripSnapshot.ts` freezes the exact settings (fuel price,
consumption, per-km rates) used at calculation time into the `Trip` record,
so editing VehicleSettings later never rewrites history.

## Running it

```bash
npm install          # also runs `prisma generate` via postinstall
npm run db:push      # creates prisma/dev.db from the schema
npm run db:seed      # default Seat Leon FR 2025 settings + 8 sample routes
npm run dev          # http://localhost:3000
```

Open `http://localhost:3000` — the home page is the calculator. On a phone,
add it to your home screen for one-tap access while driving.

### Other scripts

```bash
npm run test         # vitest — runs the full calculation test suite
npm run build        # production build
npm run start        # run the production build
npm run db:push      # push schema changes to SQLite (dev)
```

The fuel price, consumption and every cost component are configured on the
**Settings** page — nothing is hardcoded. Changing them only affects new
calculations; past trips keep the prices they were calculated with.

## Pages

| Route         | Purpose |
|---------------|---------|
| `/`           | Main + quick calculator (mobile-first, the primary screen) |
| `/settings`   | Vehicle, fuel, cost-per-km, desired profit configuration |
| `/history`    | Saved trips, with filters (date, origin, destination, status, return type) |
| `/dashboard`  | Today / this week / this month revenue, cost, profit + charts |
| `/routes`     | Saved origin→destination presets (distance, tolls) |
| `/compare`    | Route profitability comparison from saved trip history (factual, no ranking) |

## API

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/settings` | GET/PUT | Vehicle & cost configuration |
| `/api/calculate` | POST | Stateless profitability calculation (quick calculator) |
| `/api/trips` | GET/POST | List (with filters) / save a trip (freezes settings snapshot) |
| `/api/trips/:id` | GET/DELETE | Single trip |
| `/api/routes` | GET/POST | Saved route presets |
| `/api/routes/:id` | PUT/DELETE | Edit/delete a preset |
| `/api/fuel-prices` | GET/POST | Fuel price history log (also updates the current price) |
| `/api/dashboard` | GET | Today/week/month aggregates + 14-day chart series |
| `/api/analytics/summary` | GET | Filtered trip-history totals |
| `/api/analytics/routes` | GET | Per-route aggregated profitability |

## Safety constraint

RideProfit never interacts with the inDrive app in any way — no
automation, no clicking, no accepting rides. It's purely a calculator the
driver reads and decides from, manually.
