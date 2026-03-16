# Run Locally

## Install

From the repository root:

```bash
npm install
```

Node `18.18+` is required.

## Start the demo apps

Run each app in its own terminal from the repository root:

```bash
npm run dev:ui
```

```bash
npm run dev:api
```

Default endpoints:

- UI app: `http://127.0.0.1:3000`
- API server: `http://127.0.0.1:3001`

## Run tests

From the repository root:

```bash
npm test
```

Targeted runs:

```bash
npm run test:smoke
```

```bash
npm run test:regression
```

The current example flow is intentionally small:

- sign in
- add one person
- verify the list

## What the tests depend on

The test suite does not start the target applications by itself.

Before running UI or API tests, the target systems must already be reachable:

- UI app for browser tests
- API app for API tests

For local development, that usually means starting:

- `npm run dev:ui`
- `npm run dev:api`

The Playwright template then reads the target URLs and credentials from its runtime config.

## Local config

The Playwright template supports:

- `TEST_ENV=dev`
- `TEST_ENV=staging`
- `TEST_ENV=prod`

For local overrides, copy:

```bash
templates/playwright-template/.env.example
```

to:

```bash
templates/playwright-template/.env
```

The template loads:

- `.env`
- `.env.<TEST_ENV>`

with environment-specific values taking priority.

## How app URLs and credentials are resolved

The runtime config resolves values in this order:

1. environment-specific variables such as `DEV_UI_BASE_URL`
2. generic variables such as `UI_BASE_URL`
3. built-in defaults from `config/environments.ts`

The same pattern is used for credentials:

1. `DEV_APP_USERNAME` or `DEV_APP_PASSWORD`
2. `APP_USERNAME` or `APP_PASSWORD`
3. built-in defaults for the selected environment

For local `dev`, the built-in defaults are:

- UI base URL: `http://127.0.0.1:3000`
- API base URL: `http://127.0.0.1:3001`
- username: `tester`
- password: `Password123!`

## Run against another environment

Example:

```bash
cd templates/playwright-template
TEST_ENV=staging \
STAGING_UI_BASE_URL=https://staging-ui.example.internal \
STAGING_API_BASE_URL=https://staging-api.example.internal \
STAGING_APP_USERNAME=my-user \
STAGING_APP_PASSWORD=my-password \
npx playwright test
```

If those values are kept in `.env.staging`, then this is enough:

```bash
cd templates/playwright-template
TEST_ENV=staging npx playwright test
```
