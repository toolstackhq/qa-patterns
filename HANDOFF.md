# Session Handoff — REST Client Integration (2026-03-19)

## What Was Built

### 1. REST Client Library (`packages/rest-client/`)
A zero-dependency REST API automation library with 56 passing tests. Features:
- **Simple API**: `api.get()`, `api.post()`, `api.put()`, `api.patch()`, `api.delete()` — all generic typed
- **Postman-style interpolation**: `{variable}` in URLs, headers, and request bodies
- **Zoro-inspired masking**: Named profiles (`default`, `healthcare`, `fintech`, `pii`) for auto-masking sensitive fields in logs. Deep recursive case-insensitive key matching
- **Pluggable transport**: Default uses built-in `fetch`. `createTlsTransport()` for mTLS with client certs
- **Retry with backoff**: Linear or exponential, configurable status codes
- **Request/response hooks**: `beforeRequest` and `afterResponse` for intercepting/modifying
- **Schema validation**: `res.validate(ZodSchema)` with any Zod-compatible `{ parse() }` interface
- **Auto-logging**: Attaches masked request/response to Allure or any `ReportAttacher`

### 2. Sync Pipeline Changes (`scripts/sync-templates.mjs`)
- **Removed `removeApiBaseUrl` transform** from Cypress and WDIO sync targets — all templates now receive full config with `apiBaseUrl`
- **Added 10 SYNC_MAP entries** for REST client files — distributes `utils/api-client/` to all 3 templates from canonical source at `packages/qa-patterns-core/src/api/rest-client/`
- The `removeApiBaseUrl` logic was **moved to CLI scaffold time** (`stripApiFeature()` in `tools/create-qa-patterns/lib/scaffold.js`) — only applied when user opts out

### 3. Template Integration

#### Playwright Template
- `fixtures/test-fixtures.ts` — added `apiClient` fixture (creates `RestClient` from `appConfig.apiBaseUrl`)
- `tests/api-people.spec.ts` — rewrote to use `apiClient` fixture instead of Playwright's `request` context
- `eslint.config.mjs` — added Node globals (Buffer, fetch, performance, etc.) for api-client files
- Already had `demo-apps/api-demo-server/` and `demo:api` script — no changes needed

#### Cypress Template
- `cypress/support/api-tasks.ts` — **NEW** — registers `cy.task('apiRequest', { method, path, options })` so REST client runs in Node context (not browser)
- `cypress.config.ts` — wired `registerApiTasks(on)` in `setupNodeEvents`, added `apiBaseUrl` to `config.env`
- `cypress/e2e/api-people.cy.ts` — **NEW** — sample API test using `cy.task('apiRequest')`
- `demo-apps/api-demo-server/` — **NEW** — copied from Playwright template (shared codebase)
- `package.json` — added `demo:api` script
- `scripts/run-cypress.mjs` — auto-starts API server alongside UI server in dev mode
- `tsconfig.json` — added `utils/**/*.ts` to includes
- `config/environments.ts` and `config/runtime-config.ts` — now include `apiBaseUrl` (sync no longer strips it)

#### WDIO Template
- `utils/api-helper.ts` — **NEW** — exports pre-configured `apiClient` instance from runtime config
- `tests/api-people.spec.ts` — **NEW** — sample API test importing `apiClient` directly (WDIO runs in Node)
- `demo-apps/api-demo-server/` — **NEW** — copied from Playwright template
- `package.json` — added `demo:api` script
- `scripts/run-wdio.mjs` — auto-starts API server alongside UI server in dev mode
- `eslint.config.mjs` — added Node globals + `expect` for api-client and test files
- `config/environments.ts` and `config/runtime-config.ts` — now include `apiBaseUrl`

### 4. CLI Changes (`tools/create-qa-patterns/`)

#### New Flags
- `--with-api` — include REST API testing (default)
- `--no-api` — exclude REST API testing feature

#### Interactive Prompt
- After template selection, asks: `"Include REST API testing? [Y/n]"`
- Only shown in interactive mode when `--with-api`/`--no-api` not specified

#### Strip Function (`lib/scaffold.js` → `stripApiFeature()`)
When user opts out, removes at scaffold time:
- `utils/api-client/` directory
- `demo-apps/api-demo-server/` directory
- Template-specific API test files
- `demo:api` script from `package.json`
- `apiBaseUrl` lines from `config/runtime-config.ts` and `config/environments.ts`
- Framework-specific wiring (Playwright fixture import, Cypress `registerApiTasks` import, etc.)

#### Other CLI Files Changed
- `lib/args.js` — parses `--with-api`/`--no-api`
- `lib/local-env.js` — `DEV_API_BASE_URL` included for ALL templates (not just Playwright) when API enabled
- `lib/output.js` — help text updated
- `index.js` — wires `withApi` through `resolveScaffoldArgs` → `scaffoldProject`

### 5. Tests
- **56 REST client tests** — all passing (`packages/rest-client/tests/`)
- **13 CLI tests** — all passing (updated `renderLocalEnv` test + added `withApi: false` test)
- **All 3 templates typecheck** (`tsc --noEmit` clean)
- **All 3 templates lint** (`eslint .` clean)
- **Sync check passes** (`node scripts/sync-templates.mjs --check`)
- **E2E verified** — scaffolded Playwright project, ran API test against demo server, passed

## Commit History (25 commits on `main`)
```
f6799bd test: update local-env tests for API feature toggle
01016cc docs: document --with-api and --no-api in CLI help text
f9b0fd1 feat: wire API feature toggle into CLI interactive flow
b4d2ba7 feat: include DEV_API_BASE_URL in .env for all templates
29bc096 feat: add stripApiFeature to CLI scaffold
849bff3 feat: add --with-api and --no-api CLI flags
96698e2 feat: auto-start API demo server in WDIO run script
9cb9802 feat: add demo:api script to WDIO template
0e00fff fix: add Node globals to WDIO ESLint config
9f8a31a feat: add sample API test to WDIO template
8c0303f feat: add pre-configured REST client helper to WDIO template
863287a feat: auto-start API demo server in Cypress run script
b6b3dc4 feat: add demo:api script to Cypress template
3fb2d3a feat: add sample API test to Cypress template
b4d24a9 feat: add cy.task API integration to Cypress template
975dd68 fix: add Node globals to Playwright ESLint config
419d273 feat: rewrite Playwright API test to use rest-client
205da87 feat: add apiClient fixture to Playwright template
3601313 feat: add API demo server to WDIO template
4e69191 feat: add API demo server to Cypress template
84042b2 feat: sync REST client and apiBaseUrl to all templates
e2bb96e feat: add REST client to qa-patterns-core canonical source
8f6b0eb chore: register rest-client as npm workspace
5e99fa5 test: add 56 tests for REST client library
a31aca6 feat: add zero-dependency REST client library
```

## What's NOT Done Yet (Potential Follow-ups)

1. **Metadata tracking** — `.qa-patterns.json` doesn't yet track `features: { api: true/false }`. This would help the upgrade command know whether API was included.
2. **CI workflow updates** — The `.github/` CI workflows may need updating to run REST client tests and handle the API demo server.
3. **Allure integration in sample tests** — The sample API tests don't configure `logging.attacher` for Allure. Could be added as a follow-up to show masked auto-logging in action.
4. **REST client docs** — No README or usage docs for the REST client library yet.
5. **E2E testing Cypress/WDIO** — Only Playwright was E2E tested. Cypress and WDIO API tests need verification in a full scaffolded project with `npm install && npm test`.
6. **The 25 commits have NOT been pushed** — they're local only on `main`.

## Key Architecture Decisions

- **Templates ship with ALL API files on disk** — the CLI strips them at scaffold time if opted out. This avoids complex conditional sync logic.
- **Cypress uses `cy.task()`** — because Cypress tests run in browser context and can't import `node:https`. The REST client runs in Node via `setupNodeEvents`.
- **WDIO uses direct imports** — WDIO specs run in Node, so `apiClient` can be imported directly.
- **One shared API demo server** — all 3 templates use the same Express server from `demo-apps/api-demo-server/` (originally from Playwright). No code duplication.
- **`removeApiBaseUrl` moved from sync-time to scaffold-time** — keeps templates complete in the repo, strips only when generating for user.
