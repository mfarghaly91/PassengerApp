# ShuttleOps Platform

A full shuttle booking platform with a production-ready Express/Drizzle backend and a React Admin Dashboard for fleet operations management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/admin-dashboard run dev` — run the Admin Dashboard (port from $PORT, at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + helmet + express-rate-limit + pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (bcryptjs + jsonwebtoken) — access tokens 15m, refresh 30d
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + wouter + shadcn/ui + recharts + React Query

## Where things live

- `lib/db/src/schema/` — Drizzle ORM table definitions (users, routes, buses, drivers, trips, promoCodes, bookings, walletTransactions, notifications, stations)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/` — generated React Query hooks (from codegen)
- `lib/api-zod/` — generated Zod schemas (from codegen)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT authenticate + requireRole middleware
- `artifacts/api-server/src/lib/jwt.ts` — JWT sign/verify helpers
- `artifacts/admin-dashboard/src/pages/` — Admin dashboard pages
- `artifacts/admin-dashboard/src/contexts/AuthContext.tsx` — Auth state (token stored in localStorage)

## Architecture decisions

- Contract-first API: OpenAPI spec drives codegen for both React hooks and Zod schemas; server and client always stay in sync.
- JWT with dual tokens: short-lived access tokens (15m) + long-lived refresh tokens (30d) stored in DB for revocation.
- Wallet system: users hold an in-app wallet balance; bookings deduct from wallet via DB transactions.
- All numeric DB columns (price, wallet_balance, rating) are `numeric` type — must `parseFloat()` on read.
- Rate limiting: auth routes 20 req/15min, all other API routes 200 req/15min; `trust proxy: 1` set for Replit proxy.

## Product

- **Admin Dashboard**: login, KPI analytics, manage users/routes/buses/drivers/trips/bookings, view wallet transactions, manage promo codes, send notifications, global settings.
- **Backend API**: full REST API covering auth (register/login/refresh/me), fleet management, trip scheduling, seat booking with promo codes, wallet top-up/payments, real-time driver location tracking (Socket.IO ready).

## User preferences

- Use `credential` (not `email`) as the login field — accepts email or phone interchangeably.

## Seed credentials

| Role  | Email                    | Password    |
|-------|--------------------------|-------------|
| Admin | admin@shuttleops.com     | password123 |
| Driver| driver@shuttleops.com    | password123 |
| User  | alice@example.com        | password123 |

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm run typecheck` if schema changes were made — the lib declarations must be rebuilt first.
- After changing the OpenAPI spec, run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Numeric DB columns come back as strings from Drizzle — always `parseFloat()` before returning in JSON.
- The proxy routes `/api` → api-server and `/` → admin-dashboard; do not hardcode ports in app code.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
