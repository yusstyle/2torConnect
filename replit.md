# 2torConnect — Tutoring Marketplace

## Project Summary
Full-stack tutoring marketplace for Nigerian university students. Three roles: **Student**, **Tutor**, **Admin**.

### Completed Features
- Auth system (register/login/logout) for all three roles; base64 JWT-style token; Zustand store
- Student: find tutors, book sessions, chat with tutors, view/join video sessions, browse materials
- Tutor: multi-step application form (3 steps: personal info → academic details → documents); school ID card upload via multer; CGPA field; manage sessions; earnings; availability; upload materials; video teach
- Admin: manage users, sessions, transactions; approve/reject tutor applications
- Video sessions: Jitsi Meet (`meet.jit.si`), room `2torconnect-session-{id}`; no API key required
- Chat/messaging: auto-polling (3s messages, 5s conversations list)
- Study materials: upload + browse

### Key Tech
- School ID uploads: multer → `uploads/school-ids/`; served at `/uploads/school-ids/`
- DB: tutors table has `cgpa` (numeric 3,2) + `school_id_url` (text) columns
- Tutor registration endpoint: `POST /api/auth/register/tutor` accepts FormData (not JSON)
- Currency: Nigerian Naira (₦)

### Admin Credentials
`admin@2torconnect.com` / `admin@2tor2024`

---

# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Application: 3torConnect

A tutoring marketplace platform for Nigerian university students.

**Three user roles:**
- **Students**: Register, find tutors, book sessions, messaging, video library
- **Tutors**: Register (requires admin approval), manage sessions, availability, earnings, messaging
- **Admins**: Dashboard stats, user/tutor/student/session/transaction management

**Authentication**: Token-based (base64-encoded payload) stored in localStorage via Zustand store.

**Frontend routes:**
- `/` — Landing page
- `/login`, `/register`, `/register/student`, `/register/tutor`
- `/student/dashboard`, `/student/find-tutor`, `/student/sessions`, `/student/messages`, etc.
- `/tutor/dashboard`, `/tutor/students`, `/tutor/sessions`, `/tutor/earnings`, `/tutor/availability`, etc.
- `/admin/dashboard`, `/admin/users`, `/admin/tutors`, `/admin/students`, `/admin/sessions`, `/admin/transactions`, etc.

**Database Schema** (`lib/db/src/schema/`):
- `users` — all users (students, tutors, admins) with role enum
- `tutors` — tutor profile linked to user
- `students` — student profile linked to user
- `sessions` — booking sessions between tutor and student
- `transactions` — payment/withdrawal/refund records
- `messages` — direct messages between users
- `availability` — tutor weekly availability slots

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
