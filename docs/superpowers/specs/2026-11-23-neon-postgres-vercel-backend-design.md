# Neon Postgres + Vercel-hosted commerce backend

Date: 2026-11-23 · Status: approved by owner

## Intent

droneviet.vn's commerce features (checkout, quotes, login/register, order tracking, admin) fail in
production because the NestJS backend in `backend/` and its MySQL database only ever ran locally.
The owner wants a real database and backend on free infrastructure, deployed through Vercel.

## Goals

- Backend reachable at `https://api.droneviet.vn`, deployed from `lovebmt/droneviet.vn` (`backend/` root).
- Data in Neon Postgres (free tier) provisioned through the Vercel Marketplace.
- Frontend (`droneviet-vn` project) points at the API via `NEXT_PUBLIC_COMMERCE_API_URL`.
- Orders, quotes, users, inventory reservations persist.

## Non-goals (later rounds)

- Linking orders to customer accounts / "Đơn hàng của tôi".
- Persisting the cart across reloads.
- UI redesign of droneviet.vn.
- PayOS / VNPay / ViettelPost / SMTP credentials (need owner keys).

## Anti-goals

- No secrets in git. No default `admin123` / placeholder JWT secrets in production.
- Don't break the existing local dev flow beyond swapping MySQL for Postgres in docker-compose.

## Constraints

- Vercel Hobby (free) plan: cron jobs run at most once per day.
- Serverless: no long-lived `setInterval`; DB connections must use Neon's pooled URL.
- No production data exists, so migration history may be replaced.

## Approaches considered

1. **Neon + NestJS on Vercel (chosen).** Native Marketplace integration injects `DATABASE_URL`,
   pooled connections, preview branches. Requires MySQL→Postgres port.
2. Supabase on Vercel. Equivalent Postgres; its auth/storage overlap with the backend's own auth and add nothing.
3. Self-host MySQL + backend on server103. Keeps MySQL code but small disk, manual backups, owner preferred Vercel.

## Design

- **Driver:** `mysql2` → `pg`; TypeORM `type: "postgres"`, configured from `DATABASE_URL`
  (fallback to discrete `DATABASE_*` vars for local), SSL when the URL requires it.
- **Migrations:** replace the 16 MySQL migrations with one Postgres initial migration generated from
  the entities. Money columns stay `bigint` via the existing transformer; `paymentOrderCode` becomes an identity/serial column.
- **Redis/BullMQ:** unused in code → dependencies removed.
- **Serverless entry:** export the Nest app for Vercel's NestJS runtime; local `start:dev` unchanged.
- **Reservation cleanup:** remove `setInterval`. Run cleanup opportunistically when an order is created,
  plus a daily Vercel Cron hitting a protected endpoint (`CRON_SECRET`).
- **Env:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CRON_SECRET` random; `CORS_ORIGIN` = droneviet.vn origins;
  admin seeded with a random password handed to the owner privately.
- **DNS:** Cloudflare CNAME `api` → `cname.vercel-dns.com`, not proxied.
- **Local dev:** docker-compose switches to `postgres:16`; Redis service removed.

## Left to the builder

Exact Vercel project settings, migration-run mechanism (run once from local against Neon), test adjustments for Postgres.
