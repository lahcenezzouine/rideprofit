# syntax=docker/dockerfile:1
#
# RideProfit production image.
#
# Two stages:
#   1. builder — full install (incl. devDependencies), `next build`.
#   2. runner  — fresh production-only install (so Prisma's native query
#      engine is compiled for THIS image's platform, not copied from the
#      builder) + the build output. Smaller and avoids the standalone-output
#      + Prisma native-binary tracing gotchas entirely.
#
# The SQLite database is NOT baked into the image — it lives wherever
# DATABASE_URL points, which must be a path on a persistent volume (see
# DEPLOY.md). docker-entrypoint.sh runs `prisma db push` against that path
# on every container start, so the schema is always in sync before the app
# serves traffic.

FROM node:20-bookworm-slim AS base
WORKDIR /app
# Prisma's query engine needs openssl at runtime on Debian-based images.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------------
FROM base AS builder
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Default value — override in Coolify with a path on your mounted volume,
# e.g. file:/app/data/dev.db. See DEPLOY.md.
ENV DATABASE_URL="file:/app/data/dev.db"
ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
