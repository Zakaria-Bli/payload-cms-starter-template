# Payload Starter

A production-oriented starter for [Payload CMS 3](https://payloadcms.com) on Next.js 16 and PostgreSQL.

What's included:

- **Roles and access control:** `admin`, `editor` and `user` roles with reusable access helpers. The first account becomes an admin, and users can't promote themselves.
- **Uploads:** stored in `./media` locally. They switch to S3-compatible storage (AWS S3, R2, MinIO, SeaweedFS) automatically when S3 credentials are set.
- **Email:** sent through Nodemailer over SMTP when `SMTP_HOST` is set. Otherwise emails are logged to the console.
- **Validated environment:** variables are checked with zod at startup, so a bad configuration fails immediately with a clear error.
- **Migrations:** committed migrations run automatically in production. CI fails on schema changes without a migration and on stale generated files.
- **Tests:** unit tests, plus integration tests against a real PostgreSQL database using the committed migrations.
- **Health checks:** `/api/health` for liveness and `/api/ready` for readiness, which checks the database.

## Starting a new project from this template

1. Copy the repository without its history and run `git init`.
2. Rename the project:
   - the `name` and `description` in `package.json`;
   - the site title in `src/app/(frontend)/layout.tsx` and `admin.meta` in `src/payload.config.ts`;
   - the database names in `.env.example`, `.env.test.example` and `.github/workflows/ci.yml` if you don't want `app` / `app_test`.
3. Adjust roles in `src/payload/access/index.ts` and the collections in `src/payload/collections/`.
4. Create a fresh initial migration once your schema is in place: delete `src/migrations/*` except `index.ts`, then run `pnpm migrate:create initial` (see [Schema changes](#schema-changes)).
5. Review `docs/DEPENDENCIES.md` and update dependencies.

## Requirements

- Node.js `24.15.0` or newer (see `.node-version`)
- pnpm `12.21.0` (via Corepack)
- Docker, for throwaway local services

## Setup

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env   # then set PAYLOAD_SECRET: openssl rand -base64 32
```

Start PostgreSQL in a throwaway container and create the test database:

```sh
docker run -d --rm --name app-postgres -p 127.0.0.1:5432:5432 \
  -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=payload-local -e POSTGRES_DB=app \
  postgres:17-alpine
until docker exec app-postgres pg_isready -U payload -d app; do sleep 1; done
docker exec app-postgres createdb -U payload app_test
```

Stopping the container (`docker stop app-postgres`) deletes its data. Never run these commands against shared or production infrastructure.

## Development

```sh
pnpm dev
```

- The app runs at <http://localhost:3000> and the admin panel at <http://localhost:3000/admin>. The first account you create there becomes an admin. To create one from the command line instead, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` and run `pnpm seed`.
- In development, Payload pushes schema changes straight to the database. Tests and production use only the committed migrations.

### Storage

Uploads are written to `./media` unless all four of `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` are set. Setting only some of them is a startup error.

For providers other than AWS, set `S3_ENDPOINT`; path-style URLs are then used automatically. The S3 plugin always adds its `prefix` column, so the database schema and migrations are the same with or without S3.

To try S3 locally, run SeaweedFS in a container with its S3 port bound to `127.0.0.1`.

### Email

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `EMAIL_FROM_ADDRESS` to send through Nodemailer. Without `SMTP_HOST`, password-reset and verification emails are printed to the console.

## Project layout

```
src/
  app/(frontend)/        your site
  app/(payload)/         Payload admin and API routes (generated, don't edit)
  app/api/health|ready   liveness and readiness checks
  lib/env.ts             validated environment (the only place that reads process.env)
  lib/payload.ts         getPayload() for server code
  payload/access/        roles and reusable access functions
  payload/collections/   collections (register them in collections/index.ts)
  payload/globals/       globals (register them in globals/index.ts)
  payload/plugins/       plugin setup (S3 storage)
  payload/email.ts       Nodemailer adapter
  migrations/            committed database migrations
  tests/unit|int/        unit and integration tests
scripts/                 type-check, clean and seed scripts
```

## Schema changes

After changing collections, fields or globals:

```sh
pnpm generate:types
pnpm generate:importmap
pnpm migrate:create <name>   # needs a reachable database
```

Commit everything in `src/migrations/` along with the generated files. CI fails if the schema changed without a migration or if generated files are out of date.

With `NODE_ENV=production`, pending migrations run automatically when Payload starts. `pnpm migrate` and `pnpm migrate:status` run or inspect them manually.

## Checks and tests

```sh
pnpm lint            # fails on any warning
pnpm format:check
pnpm type-check      # regenerates Next.js route types, then runs TypeScript
pnpm audit:dependencies
pnpm test            # unit + integration
pnpm test:unit       # no database needed
pnpm test:int
pnpm test:coverage
```

Integration tests load `.env.test` (copy it from `.env.test.example`). The database must be local and its name must end in `_test`. Tests apply the committed migrations with schema push disabled, so they refuse a database that was created by schema push. To reset a database like that:

```sh
docker exec app-postgres dropdb -U payload app_test
docker exec app-postgres createdb -U payload app_test
```

Git hooks:

- **pre-commit:** branch-name check (`type/description`, `main`, `develop`, `staging`) and lint-staged.
- **commit-msg:** Conventional Commits.
- **pre-push:** type-check and unit tests. Integration tests need PostgreSQL, so they run in CI (and locally with `pnpm test`).

## Production

```sh
pnpm build
pnpm start
```

Before deploying:

- Set `NODE_ENV=production`, a unique `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (the public origin, used for CORS, CSRF and absolute URLs), and S3 and SMTP credentials.
- Point the load balancer at `/api/ready` for readiness and `/api/health` for liveness.
- CSP and HSTS headers are left to the deployment layer; `next.config.ts` sets the basic security headers.
- For container images, consider `output: 'standalone'` in `next.config.ts`. Note that `next start` doesn't work with standalone output; run `node .next/standalone/server.js` instead.

Dependency exceptions and security overrides are documented in [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md).
