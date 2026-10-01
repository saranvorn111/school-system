# School System

University / school management system (MVP): authentication, role- and action-based permissions, admin, teacher and student portals.

**Stack:** Next.js 16 (App Router) · TypeScript · MySQL 8 + Drizzle ORM · shadcn/ui + Tailwind v4 · TanStack Query · react-hook-form + Zod · Bun

## Getting started

```bash
docker compose up -d        # MySQL on localhost:3308
bun install
bun run db:migrate          # create tables
bun run db:seed --demo      # roles, permissions, admin (+ demo data)
bun run dev                 # http://localhost:3000
```

The admin login comes from `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). With `--demo`, teacher accounts `T0001`, `T0002` and students `S2026001`–`S2026005` are created; their passwords are in `db/seed.ts`. Change them before any real use.

| Script | What it does |
| --- | --- |
| `bun run db:generate` | Create a migration after editing `db/schema.ts` |
| `bun run db:migrate` | Apply migrations |
| `bun run db:studio` | Browse the database |
| `bun test` | Unit tests (grading, schedule clashes, permission matrix, hashing) |
| `bun run typecheck` / `bun run lint` | Static checks |

## How the code is organized

```
app/
  api/                 REST API — the only way the browser reads or changes data
  admin/ teacher/ student/ account/ login/
    page.tsx           thin server wrapper (title, route params)
    view.tsx           client page: fetches /api with TanStack Query, shadcn UI
components/
  ui/                  shadcn/ui components (generated — add more with `bunx shadcn add …`)
  app-sidebar.tsx      portal navigation (shadcn Sidebar)
  form-fields.tsx      react-hook-form + shadcn Field inputs
  page.tsx             PageHeader, Section, StatCard, QueryView (loading/error/data)
hooks/use-api.ts       useApiQuery / useApiMutation
lib/
  api/                 handler.ts (auth, JSON errors, CSRF check), errors.ts, client.ts (browser fetch)
  services/            business logic — permission checks, rules, transactions, audit
  validation/          Zod schemas shared by the browser forms and the API
  auth/                sessions, password hashing, permission matrix, authorize()
db/                    Drizzle schema, migrations, seed
```

A request flows **view → `/api/*` route → service → database**:

1. The **route** (`app/api/**/route.ts`) authenticates the session cookie, validates input with a shared Zod schema, and calls a service.
2. The **service** (`lib/services/*`) checks the permission *and its scope*, applies the business rules, writes in a transaction and records an audit entry.
3. Errors are thrown as `ApiError` and returned as JSON: `401` not logged in, `403` no permission, `404`, `409` conflict (duplicate, full section, schedule clash, locked grades), `422` invalid fields (`fieldErrors` are shown under the matching inputs), `423` account locked, `429` too many login attempts.

## Permissions

Permissions are `resource:action` codes (`lib/auth/permissions.ts`). Each role gets a permission with a **scope**:

- `global`: every record (admin)
- `assigned`: records linked to the user, e.g. a teacher's own sections
- `own`: the user's own records, e.g. a student's grades

Never rely on the UI hiding a button: every service calls `authorize()` / `authorizeSection()`. To add a permission, add it to `PERMISSIONS`, give it to roles in `ROLE_PERMISSIONS`, and run `bun run db:seed`.

## API reference

| Method | Path | Who |
| --- | --- | --- |
| POST | `/api/auth/login` · `/api/auth/logout` · `/api/auth/logout-all` | everyone |
| GET | `/api/auth/me` · `/api/auth/sessions` | logged in |
| POST / DELETE | `/api/auth/password` · `/api/auth/sessions/:id` | logged in |
| GET, POST | `/api/users` | admin |
| GET, PATCH | `/api/users/:id` | admin |
| PUT / POST / POST | `/api/users/:id/status` · `/reset-password` · `/unlock` | admin |
| GET, POST | `/api/departments` · `/api/programs` · `/api/academic-years` · `/api/courses` | admin |
| GET, POST | `/api/terms` · PUT `/api/terms/:id/current` | list: everyone, change: admin |
| GET | `/api/teachers` | admin |
| GET, POST | `/api/sections?termId=` | admin (all), teacher (own classes) |
| GET | `/api/sections/:id` | admin, assigned teacher |
| PUT | `/api/sections/:id/teacher` | admin |
| GET, POST | `/api/sections/:id/enrollments` · DELETE `/api/enrollments/:id` | admin |
| GET, PUT | `/api/sections/:id/attendance?date=` | admin, assigned teacher |
| GET, PUT | `/api/sections/:id/grades` | admin, assigned teacher |
| POST | `/api/sections/:id/grades/submit` | assigned teacher |
| POST | `/api/sections/:id/grades/approve` · `/reject` · `/publish` | admin |
| GET | `/api/grades/pending` · `/api/audit-logs` · `/api/dashboard/admin` | admin |
| GET | `/api/reports/term?termId=` · `/api/reports/term/export?kind=sections|at-risk` (CSV) | admin |
| GET, POST | `/api/notifications` · `/api/notifications/read` | logged in (own inbox) |
| GET | `/api/dashboard/teacher` | teacher |
| GET | `/api/me/dashboard` · `/api/me/timetable` · `/api/me/attendance` · `/api/me/grades` | student |

Notifications are created when grades are submitted, sent back, approved or published, when a student is enrolled, dropped or marked absent/late, and when a teacher is assigned. The navbar bell checks for new ones every 30 seconds.

The interface language (English / Khmer) is chosen in the navbar; all text is in `lib/i18n/dictionaries.ts`.

Grade workflow: `draft → submitted → approved → published` (reject returns to `draft` with a note). Students only ever see published grades.
