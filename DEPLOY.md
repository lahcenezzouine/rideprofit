# Deploying RideProfit on Coolify

RideProfit ships as a plain Dockerfile, so Coolify can build and run it
directly from your Git repository. The only thing you must get right is
**persistent storage for the SQLite database** — without it, every redeploy
wipes your settings and trip history.

This has been tested locally end-to-end (`docker build` → `docker run` with
a volume → restart → data still there) before writing this guide.

## 1. Create the resource

In Coolify:

1. **Add New Resource → Public Repository** (or your GitHub App connection)
   and point it at `https://github.com/lahcenezzouine/rideprofit`.
2. **Build Pack**: choose **Dockerfile**. Coolify will find the `Dockerfile`
   at the repo root automatically.
3. **Port**: `3000`.

(If you'd rather use Coolify's "Docker Compose" resource type instead, point
it at `docker-compose.yml` in the repo — it defines the same thing plus the
named volume, so you can skip step 2 below.)

## 2. Add persistent storage

This is the important part. In the resource's **Storages** tab, add a
**Volume Mount**:

| Field | Value |
|---|---|
| Name | `rideprofit-data` |
| Destination Path | `/app/data` |

This gives the container a persistent directory that survives rebuilds and
redeploys.

## 3. Set the environment variable

In the **Environment Variables** tab, add:

```
DATABASE_URL=file:/app/data/dev.db
```

This must point *inside* the volume you just mounted. (The Dockerfile sets
this same value as a default, but setting it explicitly in Coolify is what
actually matters — the default only protects against someone forgetting
this step, it does NOT create the volume for you.)

## 4. (Optional) Health check

Coolify can health-check the app before marking a deploy healthy. Use:

- **Path**: `/api/settings`
- **Port**: `3000`

It returns `200` with the current vehicle settings JSON once the app (and
its lazily-created default settings row) is up.

## 5. Deploy

Hit **Deploy**. On first boot, `docker-entrypoint.sh` runs `prisma db push`
against the empty volume to create the SQLite schema, then starts the
server. Watch the deployment logs for:

```
[rideprofit] Syncing database schema at /app/data/dev.db...
SQLite database dev.db created at file:/app/data/dev.db
Your database is now in sync with your Prisma schema.
[rideprofit] Starting server...
✓ Ready in ...ms
```

Open the app — Settings will show the default Seat Leon FR 2025 vehicle
(created lazily on first API call). Nothing is pre-seeded with sample
routes in production; add your own via the **Routes** page, or run the seed
script once manually (see below) if you want the 8 sample Casablanca routes.

## Updating later

Every subsequent push to your branch (or manual redeploy in Coolify) just
rebuilds the image and re-runs `prisma db push` against the *same* mounted
volume — your trip history, settings and routes are untouched. `db push` is
additive and safe for schema changes like adding a column; if a future
change could genuinely cause data loss (e.g. deleting a column with data in
it), the entrypoint will fail loudly instead of silently discarding
anything. If that happens, open a terminal to the running container in
Coolify and run `npx prisma db push --accept-data-loss` manually once you've
confirmed that's actually what you want.

## Running the seed script once (optional)

The 8 sample Casablanca routes are *not* auto-seeded in production (the seed
script needs `tsx`, a dev-only dependency, to keep the production image
lean). To add them once after deploying, open a terminal to the running
container via Coolify and run:

```bash
npx --yes tsx prisma/seed.ts
```

This is idempotent — safe to run again, it skips anything already present.

## Local testing

```bash
docker build -t rideprofit .
docker run -d -p 3000:3000 \
  -e DATABASE_URL="file:/app/data/dev.db" \
  -v rideprofit_data:/app/data \
  rideprofit
```

or simply:

```bash
docker compose up --build
```
