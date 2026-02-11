# ZeroQ AI Agent Platform - Project Definition

## 1. Vision

Plataforma SaaS multi-tenant para crear flujos de automatizacion con agentes de IA y microservicios. El sistema permite a organizaciones configurar servicios de reservas y gestionar data custom de forma flexible (estilo Notion/Airtable).

## 2. Arquitectura Multi-Tenant

### Estrategia de Aislamiento

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Organization Router                     │    │
│  │   Resuelve la DB correcta segun el tier de la org   │    │
│  └──────────────┬──────────────────────┬───────────────┘    │
│                 │                      │                     │
│         tier = "shared"        tier = "dedicated"           │
│                 │                      │                     │
│                 ▼                      ▼                     │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  Neon: Shared DB     │  │  Neon: Dedicated DB  │        │
│  │                      │  │  (1 per high-ticket  │        │
│  │  org_id filtering    │  │   client)            │        │
│  │  - Org A             │  │                      │        │
│  │  - Org B             │  │  Isolated project    │        │
│  │  - Org C             │  │  Same schema         │        │
│  └──────────────────────┘  └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

- **Shared DB (low-ticket)**: Un solo proyecto Neon. Todas las tablas tienen `organization_id`. Aislamiento por filas.
- **Dedicated DB (high-ticket)**: Un proyecto Neon separado por cliente. Mismo schema, datos completamente aislados. Creado programaticamente via Neon API.

La aplicacion resuelve la conexion correcta en runtime segun el `tier` de la organizacion almacenado en la tabla `organizations` de la DB compartida.

## 3. Schema de Base de Datos

### 3.1 Diagrama ER Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAPA 1: SISTEMA (Platform)                       │
│                        Siempre en Shared DB                             │
│                                                                         │
│  ┌─────────────────────┐       ┌──────────────────────────┐            │
│  │   organizations     │       │  organization_members    │            │
│  ├─────────────────────┤       ├──────────────────────────┤            │
│  │ id          uuid PK │◄──────│ organization_id uuid FK  │            │
│  │ name        text    │       │ id              uuid PK  │            │
│  │ slug        text UQ │       │ email           text     │            │
│  │ tier        enum    │       │ role            enum     │            │
│  │ database_url text?  │       │ invited_at      ts       │            │
│  │ settings    jsonb   │       │ created_at      ts       │            │
│  │ created_at  ts      │       └──────────────────────────┘            │
│  │ updated_at  ts      │                                               │
│  └────────┬────────────┘                                               │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
            │ organization_id (en shared DB) o implícito (en dedicated DB)
            │
┌───────────┼─────────────────────────────────────────────────────────────┐
│           ▼     CAPA 2: RESERVAS (Core Domain)                          │
│                 Existe en cada DB (shared y dedicated)                   │
│                                                                         │
│  ┌──────────────────┐    ┌───────────────────┐   ┌──────────────────┐  │
│  │    services      │    │    resources       │   │   customers      │  │
│  ├──────────────────┤    ├───────────────────┤   ├──────────────────┤  │
│  │ id        uuid PK│    │ id        uuid PK │   │ id       uuid PK │  │
│  │ org_id    uuid FK│    │ org_id    uuid FK │   │ org_id   uuid FK │  │
│  │ name      text   │    │ service_id uuid FK│   │ name     text    │  │
│  │ description text │    │ name       text   │   │ email    text    │  │
│  │ duration  int    │    │ is_active  bool   │   │ phone    text    │  │
│  │ price     numeric│    │ metadata   jsonb  │   │ metadata jsonb   │  │
│  │ is_active bool   │    │ created_at ts     │   │ created_at ts    │  │
│  │ metadata  jsonb  │    └──────┬────────────┘   └──────┬───────────┘  │
│  │ created_at ts    │           │                       │              │
│  └──────┬───────────┘    ┌──────┴────────────┐          │              │
│         │                │ resource_schedules│          │              │
│         │                ├───────────────────┤          │              │
│         │                │ id        uuid PK │          │              │
│         │                │ resource_id uuid  │          │              │
│         │                │ day_of_week int   │          │              │
│         │                │ start_time time   │          │              │
│         │                │ end_time   time   │          │              │
│         │                │ is_available bool │          │              │
│         │                └───────────────────┘          │              │
│         │                                               │              │
│         │          ┌──────────────────────┐              │              │
│         │          │    reservations      │              │              │
│         │          ├──────────────────────┤              │              │
│         └─────────►│ service_id  uuid FK  │◄─────────────┘              │
│                    │ id          uuid PK  │                             │
│                    │ org_id      uuid FK  │                             │
│                    │ resource_id uuid FK  │                             │
│                    │ customer_id uuid FK  │                             │
│                    │ start_time  ts       │                             │
│                    │ end_time    ts       │                             │
│                    │ status      enum     │                             │
│                    │ notes       text     │                             │
│                    │ metadata    jsonb    │                             │
│                    │ created_at  ts       │                             │
│                    └──────────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│              CAPA 3: DATA CUSTOM (Notion/Airtable-like)                 │
│              Existe en cada DB (shared y dedicated)                      │
│                                                                         │
│  ┌───────────────────────┐                                              │
│  │  custom_collections   │                                              │
│  ├───────────────────────┤                                              │
│  │ id            uuid PK │                                              │
│  │ org_id        uuid FK │                                              │
│  │ name          text    │──────────────────────────┐                   │
│  │ description   text    │                          │                   │
│  │ icon          text    │                          │                   │
│  │ created_at    ts      │    ┌─────────────────────┴──┐                │
│  │ updated_at    ts      │    │    custom_fields       │                │
│  └───────────┬───────────┘    ├────────────────────────┤                │
│              │                │ id           uuid PK   │                │
│              │                │ collection_id uuid FK  │                │
│              │                │ name          text     │                │
│              │                │ field_type    enum     │                │
│              │                │ field_order   int      │                │
│              │                │ options       jsonb    │                │
│              │                │ is_required   bool     │                │
│              │                │ created_at    ts       │                │
│              │                └────────────────────────┘                │
│              │                                                          │
│    ┌─────────┴──────────────┐                                           │
│    │    custom_records      │                                           │
│    ├────────────────────────┤   data JSONB example:                     │
│    │ id           uuid PK  │   {                                        │
│    │ collection_id uuid FK │     "field_uuid_1": "John Doe",            │
│    │ data          jsonb   │     "field_uuid_2": 42,                    │
│    │ created_at    ts      │     "field_uuid_3": ["tag1", "tag2"]       │
│    │ updated_at    ts      │   }                                        │
│    └────────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Detalle de Tablas

#### organizations

| Column       | Type                              | Constraints            |
| ------------ | --------------------------------- | ---------------------- |
| id           | uuid                              | PK, default gen        |
| name         | text                              | NOT NULL               |
| slug         | text                              | NOT NULL, UNIQUE       |
| tier         | enum('shared', 'dedicated')       | NOT NULL, default shared |
| database_url | text                              | NULLABLE               |
| settings     | jsonb                             | default {}             |
| created_at   | timestamp with tz                 | NOT NULL, default now  |
| updated_at   | timestamp with tz                 | NOT NULL, default now  |

#### organization_members

| Column          | Type                                     | Constraints           |
| --------------- | ---------------------------------------- | --------------------- |
| id              | uuid                                     | PK, default gen       |
| organization_id | uuid                                     | FK -> organizations   |
| email           | text                                     | NOT NULL              |
| role            | enum('owner', 'admin', 'member')         | NOT NULL, default member |
| invited_at      | timestamp with tz                        | NULLABLE              |
| created_at      | timestamp with tz                        | NOT NULL, default now |

#### services

| Column          | Type               | Constraints           |
| --------------- | ------------------ | --------------------- |
| id              | uuid               | PK, default gen       |
| organization_id | uuid               | FK -> organizations   |
| name            | text               | NOT NULL              |
| description     | text               | NULLABLE              |
| duration_minutes| integer            | NOT NULL              |
| price           | numeric(10,2)      | NULLABLE              |
| is_active       | boolean            | NOT NULL, default true|
| metadata        | jsonb              | default {}            |
| created_at      | timestamp with tz  | NOT NULL, default now |
| updated_at      | timestamp with tz  | NOT NULL, default now |

#### resources

| Column          | Type               | Constraints           |
| --------------- | ------------------ | --------------------- |
| id              | uuid               | PK, default gen       |
| organization_id | uuid               | FK -> organizations   |
| service_id      | uuid               | FK -> services        |
| name            | text               | NOT NULL              |
| is_active       | boolean            | NOT NULL, default true|
| metadata        | jsonb              | default {}            |
| created_at      | timestamp with tz  | NOT NULL, default now |
| updated_at      | timestamp with tz  | NOT NULL, default now |

#### resource_schedules

| Column       | Type               | Constraints           |
| ------------ | ------------------ | --------------------- |
| id           | uuid               | PK, default gen       |
| resource_id  | uuid               | FK -> resources       |
| day_of_week  | integer            | NOT NULL (0=Sun..6=Sat) |
| start_time   | time               | NOT NULL              |
| end_time     | time               | NOT NULL              |
| is_available | boolean            | NOT NULL, default true|

#### customers

| Column          | Type               | Constraints           |
| --------------- | ------------------ | --------------------- |
| id              | uuid               | PK, default gen       |
| organization_id | uuid               | FK -> organizations   |
| name            | text               | NOT NULL              |
| email           | text               | NULLABLE              |
| phone           | text               | NULLABLE              |
| metadata        | jsonb              | default {}            |
| created_at      | timestamp with tz  | NOT NULL, default now |
| updated_at      | timestamp with tz  | NOT NULL, default now |

#### reservations

| Column          | Type                                                    | Constraints           |
| --------------- | ------------------------------------------------------- | --------------------- |
| id              | uuid                                                    | PK, default gen       |
| organization_id | uuid                                                    | FK -> organizations   |
| service_id      | uuid                                                    | FK -> services        |
| resource_id     | uuid                                                    | FK -> resources       |
| customer_id     | uuid                                                    | FK -> customers       |
| start_time      | timestamp with tz                                       | NOT NULL              |
| end_time        | timestamp with tz                                       | NOT NULL              |
| status          | enum('pending','confirmed','cancelled','completed','no_show') | NOT NULL, default pending |
| notes           | text                                                    | NULLABLE              |
| metadata        | jsonb                                                   | default {}            |
| created_at      | timestamp with tz                                       | NOT NULL, default now |
| updated_at      | timestamp with tz                                       | NOT NULL, default now |

#### custom_collections

| Column          | Type               | Constraints           |
| --------------- | ------------------ | --------------------- |
| id              | uuid               | PK, default gen       |
| organization_id | uuid               | FK -> organizations   |
| name            | text               | NOT NULL              |
| description     | text               | NULLABLE              |
| icon            | text               | NULLABLE              |
| created_at      | timestamp with tz  | NOT NULL, default now |
| updated_at      | timestamp with tz  | NOT NULL, default now |

#### custom_fields

| Column        | Type                                                                                      | Constraints                  |
| ------------- | ----------------------------------------------------------------------------------------- | ---------------------------- |
| id            | uuid                                                                                      | PK, default gen              |
| collection_id | uuid                                                                                      | FK -> custom_collections     |
| name          | text                                                                                      | NOT NULL                     |
| field_type    | enum('text','number','date','datetime','boolean','select','multi_select','email','phone','url','relation') | NOT NULL |
| field_order   | integer                                                                                   | NOT NULL, default 0          |
| options       | jsonb                                                                                     | default {}                   |
| is_required   | boolean                                                                                   | NOT NULL, default false      |
| created_at    | timestamp with tz                                                                         | NOT NULL, default now        |

#### custom_records

| Column        | Type               | Constraints                |
| ------------- | ------------------ | -------------------------- |
| id            | uuid               | PK, default gen            |
| collection_id | uuid               | FK -> custom_collections   |
| data          | jsonb              | NOT NULL, default {}       |
| created_at    | timestamp with tz  | NOT NULL, default now      |
| updated_at    | timestamp with tz  | NOT NULL, default now      |

### 3.3 Indexes

- `organizations.slug` - UNIQUE index
- `services.organization_id` - B-tree
- `resources.organization_id` - B-tree
- `resources.service_id` - B-tree
- `customers.organization_id` - B-tree
- `customers(organization_id, email)` - UNIQUE (email unico por org)
- `reservations.organization_id` - B-tree
- `reservations(organization_id, start_time)` - Composite para queries de agenda
- `reservations.status` - B-tree
- `custom_collections.organization_id` - B-tree
- `custom_records.collection_id` - B-tree
- `custom_records.data` - GIN para busquedas JSONB

## 4. Tech Stack

| Categoria    | Tecnologia                         | Uso                                             |
| ------------ | ---------------------------------- | ----------------------------------------------- |
| Framework    | Next.js 16 (App Router)            | Frontend + Backend (Server Actions, API Routes) |
| DB Infra     | Neon Serverless Postgres           | Multi-tenant databases                          |
| ORM          | Drizzle ORM                        | Schema definition, queries, migrations          |
| DB Driver    | @neondatabase/serverless           | HTTP adapter para queries                       |
| UI           | Shadcn/ui + Tailwind CSS 4         | Componentes y estilos                           |
| Validation   | Zod                                | Runtime validation de inputs                    |
| File Parsing | Papa Parse (CSV) + SheetJS (Excel) | Import de archivos custom (Fase 3)              |

## 5. Estructura de Carpetas

```
test-neon-db/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Sidebar + org selector
│   │   ├── organizations/
│   │   │   ├── page.tsx                  # Lista de organizaciones
│   │   │   └── new/page.tsx              # Crear organizacion
│   │   └── [orgSlug]/
│   │       ├── page.tsx                  # Dashboard de la organizacion
│   │       ├── settings/page.tsx         # Configuracion de la org
│   │       ├── services/                 # CRUD servicios (Fase 2)
│   │       ├── resources/                # CRUD recursos (Fase 2)
│   │       ├── customers/                # CRUD clientes (Fase 2)
│   │       ├── reservations/             # Gestion reservas (Fase 2)
│   │       └── collections/              # Data custom (Fase 3)
│   │           ├── page.tsx              # Lista colecciones
│   │           ├── new/page.tsx          # Crear coleccion
│   │           └── [collectionId]/
│   │               ├── page.tsx          # Vista tabla (Airtable-like)
│   │               └── import/page.tsx   # Import CSV/Excel
│   ├── layout.tsx                        # Root layout
│   ├── page.tsx                          # Landing / redirect
│   └── globals.css
├── src/
│   ├── db/
│   │   ├── index.ts                      # Connection factory
│   │   ├── schema/
│   │   │   ├── index.ts                  # Re-exports all schemas
│   │   │   ├── organizations.ts          # organizations + organization_members
│   │   │   ├── services.ts              # services + resources + resource_schedules
│   │   │   ├── reservations.ts          # reservations
│   │   │   ├── customers.ts             # customers
│   │   │   └── custom-data.ts           # custom_collections + custom_fields + custom_records
│   │   └── seed.ts                       # Seed data para desarrollo
│   ├── lib/
│   │   ├── validators.ts                # Zod schemas para validacion
│   │   └── utils.ts                     # Helpers generales (cn, slugify, etc.)
│   ├── actions/                          # Server Actions
│   │   ├── organizations.ts
│   │   ├── services.ts
│   │   ├── reservations.ts
│   │   └── collections.ts
│   └── types/
│       └── index.ts                     # Shared TypeScript types
├── components/
│   ├── ui/                              # Shadcn components (auto-generated)
│   ├── data-table/                      # Tabla generica reutilizable
│   ├── file-import/                     # CSV/Excel importer (Fase 3)
│   └── layout/                          # Sidebar, header, org selector
├── drizzle/                             # Generated migration files
├── drizzle.config.ts                    # Drizzle Kit configuration
├── .env                                 # DATABASE_URL
├── package.json
├── tsconfig.json
└── PROJECT_DEFINITION.md                # This file
```

## 6. DB Connection Strategy

```typescript
// src/db/index.ts - Connection factory pattern
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

// Shared DB - always available (low-ticket clients + platform tables)
const sharedSql = neon(process.env.DATABASE_URL!);
export const sharedDb = drizzle({ client: sharedSql, schema });

// Tenant DB - resolved dynamically for high-ticket clients
export const getTenantDb = (databaseUrl: string) => {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
};

// Smart resolver: returns the correct DB instance based on org tier
export const getDbForOrg = async (orgSlug: string) => {
  const org = await sharedDb.query.organizations.findFirst({
    where: eq(schema.organizations.slug, orgSlug),
  });

  if (!org) throw new Error(`Organization not found: ${orgSlug}`);

  if (org.tier === "dedicated" && org.databaseUrl) {
    return { db: getTenantDb(org.databaseUrl), orgId: org.id, isDedicated: true };
  }

  return { db: sharedDb, orgId: org.id, isDedicated: false };
};
```

## 7. Convenciones de Codigo

### Nomenclatura
- **Tablas**: snake_case plural (`organizations`, `custom_records`)
- **Columnas**: snake_case (`organization_id`, `created_at`)
- **Archivos**: kebab-case (`custom-data.ts`, `db-resolver.ts`)
- **Componentes**: PascalCase (`OrganizationCard.tsx`)
- **Server Actions**: camelCase con verbo (`createOrganization`, `deleteService`)

### Patrones
- Server Components por defecto; `'use client'` solo cuando es necesario
- Server Actions para mutaciones (no API Routes)
- Zod schemas para validar inputs de Server Actions
- Todas las tablas de dominio llevan `organization_id` en shared DB
- JSONB `metadata` en tablas core para extensibilidad sin migraciones

### Scripts de Desarrollo

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "npx tsx src/db/seed.ts"
  }
}
```

## 8. Variables de Entorno

```env
# Neon Shared Database (required)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# Neon API (for Fase 4 - creating dedicated DBs programmatically)
# NEON_API_KEY=neon_api_key_here
```

## 9. Roadmap de Implementacion

### Fase 1 - Fundacion (MVP)
- [x] Definicion de proyecto
- [ ] Setup Drizzle ORM + Neon connection
- [ ] Schema completo en Drizzle
- [ ] Migraciones iniciales
- [ ] Init Shadcn + layout base (sidebar, org selector)
- [ ] CRUD de organizaciones (UI + Server Actions)

### Fase 2 - Sistema de Reservas
- [ ] CRUD de servicios y recursos por organizacion
- [ ] Gestion de horarios/disponibilidad (resource_schedules)
- [ ] Creacion y gestion de reservas
- [ ] Dashboard de reservas por organizacion
- [ ] Validacion de conflictos de horario

### Fase 3 - Data Custom
- [ ] Crear/configurar colecciones y campos custom
- [ ] Vista tipo Airtable (tabla editable inline)
- [ ] Import CSV/Excel con mapeo de columnas
- [ ] Filtros, ordenamiento y busqueda en colecciones

### Fase 4 - Multi-DB (High-Ticket)
- [x] Integracion Neon API para crear proyectos dedicados
- [ ] Migration runner para DBs dedicadas
- [x] UI de upgrade tier en org settings
- [ ] Connection pooling y cache de conexiones

> **Documento de analisis**: Ver [MULTI_TENANT_ANALYSIS.md](./MULTI_TENANT_ANALYSIS.md) para un analisis exhaustivo de las implicaciones de la arquitectura multi-DB, alternativas evaluadas (PostgreSQL Schemas, RLS, Neon Branches), matriz comparativa, y plan de accion recomendado.

### Fase 5 - Automatizaciones (Futuro)
- [ ] Motor de flujos/workflows
- [ ] Integracion con agentes IA
- [ ] Webhooks y triggers
- [ ] Marketplace de automatizaciones
