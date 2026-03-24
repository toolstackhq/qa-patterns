# WebdriverIO Template

This is a WebdriverIO + TypeScript automation framework template for UI tests.

## Table of contents

- [Feature set](#feature-set)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Environment and secrets](#environment-and-secrets)
- [Main commands](#main-commands)
- [Reports and artifacts](#reports-and-artifacts)
- [Docker](#docker)
- [AI assistance](#ai-assistance)
- [Add a new test](#add-a-new-test)
- [Extend the framework](#extend-the-framework)
- [Template upgrades](#template-upgrades)
- [CI](#ci)

## Feature set

- WebdriverIO + TypeScript setup
- Mocha-based specs with page objects and step logging
- generic data factory pattern with `DataFactory`
- folder-level `README.md` guides and file-header comments for easier onboarding
- multi-environment runtime config with `dev`, `staging`, and `prod`
- env-based secret resolution with a replaceable `SecretProvider`
- WebdriverIO spec reporter by default
- optional Allure single-file report
- screenshots and structured logs for debugging
- ESLint rules that protect framework conventions
- Dockerfile for containerized CI validation
- GitHub Actions workflow for the template

## How it works

- specs in `tests/` own the workflow and assertions
- page objects in `pages/` own locators and browser actions
- runtime config is loaded from `config/runtime-config.ts`
- application URLs and credentials are resolved from `TEST_ENV`
- the bundled demo app auto-starts during `npm test` in local `dev` mode when the default local URL is in use
- reports and artifacts are written under `reports/`, `allure-results/`, and `test-results/`

## Project structure

```text
wdio-template
├── tests
├── pages
├── components
├── data
├── config
├── demo-apps
├── docker
├── reporters
├── utils
├── lint
├── scripts
├── wdio.conf.ts
└── package.json
```

## Quick start

1. Install dependencies.

```bash
npm install
```

2. Run tests.

```bash
npm test
```

In local `dev`, the template starts its bundled demo app automatically before the tests run.

If you want to run the demo app manually for debugging:

```bash
npm run demo:ui
npm run demo:api
```

Default local values:

- UI base URL: `http://127.0.0.1:3000`
- credentials: generated into local `.env` on first run

## Environment and secrets

The template supports:

- `TEST_ENV=dev`
- `TEST_ENV=staging`
- `TEST_ENV=prod`

Runtime values are resolved in this order:

1. environment-specific variables such as `DEV_UI_BASE_URL`
2. generic variables such as `UI_BASE_URL`
3. built-in defaults from `config/environments.ts`

The same pattern is used for credentials:

1. `DEV_APP_USERNAME` or `DEV_APP_PASSWORD`
2. `APP_USERNAME` or `APP_PASSWORD`
3. built-in empty defaults for the selected environment

For local overrides, copy:

```bash
.env.example
```

to:

```bash
.env
```

The template loads:

- `.env`
- `.env.<TEST_ENV>`

On the first local run, the template also creates a `.env` file with random demo credentials if one does not already exist.

Example:

```bash
TEST_ENV=staging \
STAGING_UI_BASE_URL=https://staging-ui.example.internal \
STAGING_APP_USERNAME=my-user \
STAGING_APP_PASSWORD=my-password \
npm test
```

If you want to disable the bundled local demo app even in `dev`, use:

```bash
WDIO_DISABLE_LOCAL_DEMO_APP=true npm test
```

If your team uses a real secret system later, replace the implementation behind `config/secret-manager.ts`.

## Main commands

```bash
npm test
npm run test:smoke
npm run test:regression
npm run test:critical
npm run demo:ui
npm run demo:api
npm run lint
npm run typecheck
npm run report:allure
```

## Reports and artifacts

Optional Allure report:

```bash
npm run report:allure
```

Outputs:

- Allure single file: `reports/allure/index.html`
- structured event log: `reports/logs/wdio-events.jsonl`
- raw Allure results: `allure-results`
- failure screenshots: `test-results`

If you only want WebdriverIO's built-in terminal reporting, remove the `allure` reporter entry in `wdio.conf.ts`.

## Docker

The template includes:

```bash
docker/Dockerfile
```

That image runs the same `scripts/run-tests.sh` entrypoint inside a Linux container. In CI, it is intended to connect to the bundled demo services over explicit URLs such as:

```bash
DEV_UI_BASE_URL=http://host.docker.internal:3000
DEV_API_BASE_URL=http://host.docker.internal:3001
```

## AI assistance

Generated projects include:

- `AI_CONTEXT.md` for any LLM
- `AGENTS.md` as a thin tool-facing pointer to that context

If a team uses AI to add or maintain specs, load `AI_CONTEXT.md` first so the model keeps selectors, assertions, and page-object boundaries consistent.

## Add a new test

Create specs under `tests/`.

Keep the pattern simple:

- create data with `DataFactory`
- interact through page objects
- assert in the spec

Example shape:

```ts
describe('do something @smoke', () => {
  it('uses page objects and data factories', async () => {
    // use page objects here
  });
});
```

## Extend the framework

Common extension points:

- update or replace the bundled demo app under `demo-apps/`
- add page objects under `pages/`
- add reusable UI pieces under `components/`
- add more generic builders under `data/factories/`
- add stronger custom lint rules in `lint/architecture-plugin.cjs`
- add custom reporters under `reporters/`

Recommended rules:

- keep selectors in page objects
- keep assertions in spec files
- prefer stable selectors such as labels, button text, and `data-testid`
- keep the data layer generic until the project really needs domain-specific factories

## Template upgrades

This project includes a `.testkit.json` metadata file so future CLI versions can compare the current project against the managed template baseline.

Check for available safe updates:

```bash
npx -y @toolstackhq/create-testkit upgrade check .
```

Apply only safe managed-file updates:

```bash
npx -y @toolstackhq/create-testkit upgrade apply --safe .
```

The upgrade flow is conservative. It updates framework infrastructure such as config, scripts, workflows, and package metadata when those files are still unchanged from the generated baseline. If you changed a managed file yourself, the CLI reports a conflict instead of overwriting it.

## CI

The CI entrypoint is:

```bash
scripts/run-tests.sh
```

The bundled workflow lives in:

```bash
.github/workflows/wdio-tests.yml
```
