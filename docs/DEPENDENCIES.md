# Dependency exceptions

`pnpm audit:dependencies` (moderate and above) must pass in CI. Every exception and override in
`pnpm-workspace.yaml` is listed here with its reason and a date to check it again. Remove an entry
as soon as an upstream release makes it unnecessary.

Last reviewed: 2026-11-15. Review again by: 2027-01-15, or on every Payload or Next.js upgrade.

## Ignored advisories

| Advisory            | Package                                                                   | Why it is accepted                                                                                                                                                                                                                        | Remove when                                                         |
| ------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| GHSA-834v-8h66-3h79 | `happy-dom` 20.x via `@payloadcms/richtext-lexical` → `@lexical/headless` | Fixed only in happy-dom 21, outside the `^20` range Lexical requires. Only reached when server code converts HTML to Lexical (`@lexical/headless/dom`), which this template does not do. **Don't feed untrusted HTML to that converter.** | Lexical allows happy-dom ≥ 21.0.4, or a 20.x fix is released.       |
| GHSA-c8p4-j97h-3vg8 | same as above                                                             | Same code path (SSRF when parsing untrusted HTML).                                                                                                                                                                                        | happy-dom ≥ 20.14.7 is released or Lexical moves to 21.             |
| GHSA-g3hv-75wg-m249 | `minimatch` 10.x via `eslint-config-next` → `@typescript-eslint`          | Development-only lint tooling that only matches the repository's own glob patterns. Not shipped in the production build.                                                                                                                  | `@typescript-eslint/typescript-estree` allows `minimatch` ≥ 11.0.1. |

## Overrides (security floors)

| Package     | Floor     | Reason                                                                         |
| ----------- | --------- | ------------------------------------------------------------------------------ |
| `dompurify` | `^3.4.17` | Patched XSS advisories; pulled in by the Payload admin UI.                     |
| `undici`    | `^7.30.1` | Patched request-smuggling and DoS advisories; pulled in transitively.          |
| `esbuild`   | `^0.25.0` | Dev-server advisory; `drizzle-kit` (pinned by `@payloadcms/db-postgres`) lags. |

Check each override with `pnpm why <package>` before removing it; drop it once every dependent
already requires a patched version.
