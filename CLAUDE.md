# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm lint         # Run ESLint

# Database
pnpm db:push      # Push schema changes directly to the database (dev)
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio (DB GUI)
pnpm db:seed      # Seed the database with demo data (destructive - clears all data first)
```

## Environment Variables

Create a `.env` file with:
- `DATABASE_URL` — shared Neon database connection string (required)
- `NEON_API_KEY` — Neon API key for provisioning dedicated databases
- `NEON_ORG_ID` — Neon organization ID (required if the API key belongs to a Neon org)
- `ZEROQ_API_KEY` — API key for REST endpoints (optional; auth is skipped if not set)

## Architecture

This is a multi-tenant SaaS booking platform (Next.js 16 App Router + Drizzle ORM + Neon Postgres).

### Multi-tenant Database Strategy

The core concept is a two-tier database model:
- **"shared" tier** — organization data lives in the main database, all queries filter by `organization_id`
- **"dedicated" tier** — organization gets its own isolated Neon project; `databaseUrl` is stored on the org record

The smart resolver in `src/db/index.ts` handles this transparently:
- `sharedDb` — direct Drizzle client for the shared database; used for platform-level tables and shared-tier orgs
- `getTenantDb(url)` — creates a Drizzle client for a dedicated tenant database
- `getDbForOrg(orgSlug)` — looks up the org, returns the correct `{db, orgId, isDedicated}`

All page data fetching and mutations should use `getDbForOrg` for org-scoped data, or `sharedDb` directly for platform-level operations.

### Directory Structure

```
app/                          # Next.js App Router
  (dashboard)/
    [orgSlug]/                # Per-org dashboard pages (customers, services, reservations, collections, settings)
    organizations/            # Org management (list, create)
  api/v1/[orgSlug]/           # REST API endpoints (protected by x-api-key header)
  layout.tsx, page.tsx

src/
  db/
    index.ts                  # DB clients + getDbForOrg resolver
    schema/                   # Drizzle table definitions (one file per domain)
    seed.ts                   # Demo data seeder
  actions/                    # Next.js Server Actions (all mutations live here)
    organizations.ts
    neon-projects.ts          # Provision/assign/unlink dedicated Neon databases
    services.ts, customers.ts, reservations.ts, collections.ts
  lib/
    neon-api.ts               # Neon API client factory + region/version constants
    api-auth.ts               # validateApiKey() for REST routes
    validators.ts             # Zod v4 schemas for all inputs

components/
  ui/                         # Shadcn/UI components
  layout/                     # App sidebar

lib/utils.ts                  # cn() utility (clsx + tailwind-merge)
```

### Schema Overview

All domain tables except `organizations` carry an `organization_id` FK:
- `organizations` + `organization_members` — platform tables, always in shared db
- `services` → `resources` → `resource_schedules` — booking catalog
- `customers` — org-scoped customer records
- `reservations` — booking records (links service + resource + customer)
- `custom_collections` + `custom_fields` + `custom_records` — Notion/Airtable-style dynamic data; record data stored as JSONB keyed by field ID

### Key Patterns

- **Server Actions**: All data mutations use Next.js Server Actions (`"use server"`) in `src/actions/`. Actions return `ActionResult<T>` (`{ success, data?, error? }`).
- **Validators**: All action inputs are validated with Zod v4 (imported as `from "zod/v4"`).
- **REST API auth**: `validateApiKey(request)` from `src/lib/api-auth.ts` — returns a 401 `NextResponse` or `null` if valid. Auth is skipped in dev if `ZEROQ_API_KEY` is not set.
- **Dedicated DB provisioning**: `provisionDedicatedDatabase(orgId)` in `src/actions/neon-projects.ts` creates a Neon project via API, runs `drizzle-kit push` against it, then saves the pooled connection URI.
- **Path aliases**: `@/` maps to the project root (e.g., `@/src/db`, `@/components/ui/button`).
