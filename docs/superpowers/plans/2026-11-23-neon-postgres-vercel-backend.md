# Neon Postgres + Vercel Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the NestJS commerce backend on Vercel at `api.droneviet.vn` backed by Neon Postgres, and point droneviet.vn at it.

**Architecture:** Port TypeORM config/entities from MySQL to Postgres, collapse migrations into one Postgres initial migration generated from entities, replace the in-process cleanup timer with a cron-secured endpoint + on-order cleanup, deploy `backend/` as a second Vercel project.

**Tech Stack:** NestJS 10, TypeORM 0.3, `pg`, Neon (Vercel Marketplace), Vercel Hobby, Cloudflare DNS, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-23-neon-postgres-vercel-backend-design.md`

## Global Constraints

- Vercel Hobby: cron at most once per day.
- No secrets committed; production JWT/CRON/admin secrets random, stored only in Vercel env.
- `synchronize: false` always; schema only via migrations.
- All commands run from `backend/` unless stated. Commits authored as `lovebmt`.

## Review Focus

- `DATABASE_URL` with `sslmode=require` (Neon) → TLS connection succeeds; plain local URL → no TLS.
- Two concurrent orders for the last unit → `pessimistic_write` still serializes on Postgres (unchanged service code; verify via existing service specs passing).
- `paymentOrderCode` must stay unique + auto-assigned on insert in Postgres (identity column).
- Cron endpoint called without/with wrong `Authorization: Bearer <CRON_SECRET>` → 401, never runs cleanup.
- Browser at `https://www.droneviet.vn` calling API → CORS allows both apex and `www` origins.

---

### Task 1: Postgres data source

**Files:**
- Modify: `backend/src/database/data-source.ts`, `backend/src/database/data-source.spec.ts`
- Modify: entities using `longtext` → `text`; drop `unsigned: true` options
- Modify: `backend/package.json` (add `pg`; remove `mysql2`, `ioredis`, `bullmq`), `docker-compose.yml` (postgres:16 on 5433, drop redis), `backend/.env.example`

**Interfaces:**
- Produces: `createDatabaseOptions(env: NodeJS.ProcessEnv): DataSourceOptions` returning `type: "postgres"`; uses `env.DATABASE_URL` as `url` when set, else `DATABASE_HOST/PORT(5432)/USER/PASSWORD/NAME`; `ssl: { rejectUnauthorized: false }` iff the URL contains `sslmode=require`.

- [ ] Update spec: tests `uses postgres from discrete vars` (expects `type: "postgres"`, `port: 5432`, `synchronize: false`, migrations length 1) and `uses DATABASE_URL with TLS when sslmode=require` (expects `url` set, `ssl` truthy) and `local DATABASE_URL has no TLS` (`ssl` falsy).
- [ ] Run `npx vitest run src/database/data-source.spec.ts` → FAIL.
- [ ] Implement; swap deps; update entities/compose/env example.
- [ ] Run full `npm test` → only migration specs fail (removed in Task 2).

### Task 2: Single Postgres initial migration

**Files:**
- Delete: `backend/src/database/migrations/*` (16 files + 2 specs)
- Create: `backend/src/database/migrations/<ts>-postgres-initial.ts` (generated)

- [ ] `docker compose up -d postgres`; `DATABASE_URL=postgres://droneviet:droneviet@localhost:5433/droneviet npx typeorm-ts-node-commonjs migration:generate src/database/migrations/PostgresInitial -d src/database/data-source.ts`.
- [ ] Register it in `data-source.ts`; `migration:run`, `seed:catalog`, `seed:admin` succeed locally.
- [ ] Verify `paymentOrderCode` is identity/serial + unique in generated SQL.
- [ ] `npm test` + `npm run build` pass. Commit `feat(backend): port database to postgres`.

### Task 3: Serverless-safe reservation cleanup

**Files:**
- Delete: `backend/src/orders/reservation-cleanup.service.ts`
- Create: `backend/src/orders/cron.controller.ts` + `cron.controller.spec.ts`
- Modify: `backend/src/orders/orders.module.ts`, `orders.service.ts` (call `releaseExpiredReservations()` at start of order creation, errors logged not thrown)
- Create: `backend/vercel.json` with `crons: [{ path: "/cron/release-reservations", schedule: "0 3 * * *" }]`

**Interfaces:**
- Produces: `GET /cron/release-reservations` → `{ released: number }`; requires header `authorization: Bearer ${CRON_SECRET}`, else `UnauthorizedException`; missing `CRON_SECRET` env → always 401.

- [ ] Spec: `rejects missing/wrong bearer`, `rejects when CRON_SECRET unset`, `returns released count with correct bearer`.
- [ ] FAIL → implement → PASS; `npm test`, `npm run build`. Commit `feat(backend): cron-driven reservation cleanup`.

### Task 4: Provision + deploy

- [ ] `vercel integration add neon` (owner may need to accept terms in browser); attach to new project `droneviet-api` (root `backend/`, git `lovebmt/droneviet.vn`).
- [ ] Env on `droneviet-api` (production): `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CRON_SECRET` (random 48-byte), `CORS_ORIGIN=https://droneviet.vn,https://www.droneviet.vn`, `NODE_ENV=production`.
- [ ] Run `migration:run`, `seed:catalog`, `seed:admin` (random `SEED_ADMIN_PASSWORD`) against Neon's unpooled URL from local.
- [ ] Deploy; add domain `api.droneviet.vn`; Cloudflare CNAME `api` → `cname.vercel-dns.com` (DNS only).
- [ ] Frontend `droneviet-vn`: set `NEXT_PUBLIC_COMMERCE_API_URL=https://api.droneviet.vn` (production), push main → deploy READY (not BLOCKED).
- [ ] Smoke: `GET api.droneviet.vn/catalog...` 200 with products; register + login; create order → appears via `GET /orders/:orderNumber`; cron endpoint 401 without secret.
- [ ] Update `connect-infra` skill with project/domain facts.
