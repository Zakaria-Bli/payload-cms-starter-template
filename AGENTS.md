# Agent instructions

This is a Payload CMS 3 + Next.js 16 + PostgreSQL project. `README.md` covers setup and workflows.

## Layout

- `src/payload.config.ts` — wires everything together; keep it thin.
- `src/payload/collections/` — one file per collection, or a folder (`Users/index.ts` plus
  `hooks/`) when it has its own hooks or fields. Register new collections in `collections/index.ts`.
- `src/payload/globals/` — globals, registered in `globals/index.ts`.
- `src/payload/access/` — reusable access functions (`isAdmin`, `isAdminOrSelf`, ...). Collections
  must set access explicitly; Payload's default lets any signed-in user do anything.
- `src/payload/plugins/` — plugin setup (S3 storage is enabled only when its env vars are set).
- `src/payload/email.ts` — Nodemailer, enabled only when `SMTP_HOST` is set.
- `src/lib/env.ts` — the only place that reads `process.env`. Add new variables to the schema and
  to `.env.example`.
- `src/lib/payload.ts` — `getPayload()` for server code.
- Business logic that spans collections belongs in plain services (e.g. `src/modules/<feature>/`),
  not in Payload hooks. Hooks should stay small and collection-local.

## Rules

- Use the globally installed `payload` skill for Payload work before relying on memory.
- Local API calls made on behalf of a user must pass `user` **and** `overrideAccess: false`.
- Pass `req` to nested Payload operations inside hooks to keep them in the same transaction.
- Run supporting services (PostgreSQL, S3-compatible storage, SMTP) in throwaway Docker containers;
  don't add Docker files to the repo. The app runs with `pnpm dev`.
- After schema changes, run `pnpm generate:types`, `pnpm generate:importmap` and
  `pnpm migrate:create <name>`, and commit the results.
- Before finishing, run `pnpm lint`, `pnpm format:check`, `pnpm type-check` and `pnpm test`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
