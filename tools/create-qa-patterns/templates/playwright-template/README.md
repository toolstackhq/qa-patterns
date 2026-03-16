# Playwright Template

This is a Playwright + TypeScript automation framework template for UI and API tests.

## Table of contents

- [Feature set](#feature-set)
- [How it works](#how-it-works)
- [Project structure](#project-structure)
- [Quick start](#quick-start)
- [Environment and secrets](#environment-and-secrets)
- [Main commands](#main-commands)
- [Reports and artifacts](#reports-and-artifacts)
- [Add a new test](#add-a-new-test)
- [Extend the framework](#extend-the-framework)
- [CI and Docker](#ci-and-docker)

## Feature set

- Playwright + TypeScript setup
- page object pattern with selectors kept out of tests
- shared fixtures for config, logging, data, and page objects
- generic data factory pattern with `DataFactory`
- multi-environment runtime config with `dev`, `staging`, and `prod`
- env-based secret resolution with a replaceable `SecretProvider`
- Playwright HTML report by default
- optional Allure single-file report
- traces, screenshots, videos, and structured logs for debugging
- ESLint rules that protect framework conventions
- GitHub Actions workflow and Docker support

## How it works

- tests import shared fixtures from `fixtures/test-fixtures.ts`
- page objects in `pages/` own locators and user actions
- runtime config is loaded from `config/runtime-config.ts`
- application URLs and credentials are resolved from `TEST_ENV`
- reports and artifacts are written under `reports/`, `allure-results/`, and `test-results/`

## Project structure

```text
playwright-template
├── tests
├── pages
├── components
├── fixtures
├── data
├── config
├── reporters
├── utils
├── lint
├── scripts
├── docker
├── playwright.config.ts
└── package.json
```

## Quick start

1. Install dependencies.

```bash
npm install
```

2. Start the target apps you want the tests to hit.

For the local demo apps from the root repo:

```bash
npm run dev:ui
```

```bash
npm run dev:api
```

3. Run tests.

```bash
npm test
```

Default local values:

- UI base URL: `http://127.0.0.1:3000`
- API base URL: `http://127.0.0.1:3001`
- username: `tester`
- password: `Password123!`

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
3. built-in defaults for the selected environment

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

Example:

```bash
TEST_ENV=staging \
STAGING_UI_BASE_URL=https://staging-ui.example.internal \
STAGING_API_BASE_URL=https://staging-api.example.internal \
STAGING_APP_USERNAME=my-user \
STAGING_APP_PASSWORD=my-password \
npx playwright test
```

If your team uses a real secret system later, replace the implementation behind `config/secret-manager.ts`.

## Main commands

```bash
npm test
npm run test:smoke
npm run test:regression
npm run test:critical
npm run lint
npm run typecheck
npm run report:playwright
npm run report:allure
```

## Reports and artifacts

Default Playwright HTML report:

```bash
npm run report:playwright
```

Optional Allure report:

```bash
npm run report:allure
```

Outputs:

- Playwright HTML: `reports/html`
- Allure single file: `reports/allure/index.html`
- structured event log: `reports/logs/playwright-events.jsonl`
- raw Allure results: `allure-results`
- traces, screenshots, videos: `test-results`

If you only want Playwright reporting, remove the `allure-playwright` reporter entry in `playwright.config.ts`.

## Add a new test

Create tests under `tests/` and import the shared fixtures:

```ts
import { expect, test } from "../fixtures/test-fixtures";
```

Keep the pattern simple:

- create data with `dataFactory`
- interact through page objects
- assert in the test

Example shape:

```ts
test("do something @smoke", async ({ dataFactory, loginPage }) => {
  const person = dataFactory.person();
  // use page objects here
});
```

## Extend the framework

Common extension points:

- add page objects under `pages/`
- add reusable UI pieces under `components/`
- extend fixtures in `fixtures/test-fixtures.ts`
- add more generic builders under `data/factories/`
- add stronger custom lint rules in `lint/architecture-plugin.cjs`
- add custom reporters under `reporters/`

Recommended rules:

- keep selectors in page objects
- keep assertions in test files
- prefer semantic selectors such as `getByRole`, `getByLabel`, and `data-testid`
- keep the data layer generic until the project really needs domain-specific factories

## CI and Docker

The CI entrypoint is:

```bash
scripts/run-tests.sh
```

Docker support is included in:

```bash
docker/Dockerfile
```

The included GitHub Actions workflow installs dependencies, runs tests, and uploads artifacts. The Docker path is also validated in CI so the container setup does not drift from the normal runner path.
