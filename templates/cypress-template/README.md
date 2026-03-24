# Cypress Template

This is a Cypress + TypeScript automation framework template for a small deterministic UI flow.

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

- Cypress + TypeScript setup
- Cypress-native custom commands for common user actions
- page modules that own selectors and keep spec files focused on behavior
- generic `DataFactory` helpers for repeatable UI data
- folder-level `README.md` guides and file-header comments for easier onboarding
- multi-environment runtime config with `dev`, `staging`, and `prod`
- env-based secret resolution with a replaceable `SecretProvider`
- built-in screenshots and videos on failure
- optional single-file Allure report
- ESLint rules that keep selectors out of spec files
- bundled deterministic UI and API demo apps
- Dockerfile for containerized CI validation
- GitHub Actions workflow

## How it works

- tests live in `cypress/e2e/`
- shared Cypress commands live in `cypress/support/commands.ts`
- selectors and page-level helpers live in `cypress/support/pages/`
- runtime config is loaded from `config/runtime-config.ts`
- bundled demo app auto-starts during `npm test` and `npm run open` in local `dev` when the default local URL is in use
- screenshots and videos are written under `reports/`

## Project structure

```text
cypress-template
├── cypress
│   ├── e2e
│   └── support
├── config
├── demo-apps
├── docker
├── scripts
├── .github
├── cypress.config.ts
└── package.json
```

## Quick start

1. Install dependencies.

```bash
npm install
```

2. Run the example test.

```bash
npm test
```

In local `dev`, the template starts its bundled demo app automatically when the default local URL is still in use.

If you want the interactive Cypress runner:

```bash
npm run open
```

If you want to run the demo app manually for debugging:

```bash
npm run demo:ui
npm run demo:api
```

If you want an Allure report after a run:

```bash
npm run report:allure
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

Credentials resolve the same way:

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

On the first local run, the template also creates a `.env` file with random demo credentials if one does not already exist.

If you want to disable the bundled local demo app even in `dev`, use:

```bash
CY_DISABLE_LOCAL_DEMO_APP=true npm test
```

If your team later uses a real secret system, replace the implementation behind `config/secret-manager.ts`.

## Main commands

```bash
npm test
npm run open
npm run demo:ui
npm run demo:api
npm run lint
npm run typecheck
npm run cy:run
npm run report:allure
```

## Reports and artifacts

Outputs:

- Cypress videos: `reports/videos`
- Cypress screenshots: `reports/screenshots`
- Allure single file: `reports/allure/index.html`
- raw Allure results: `allure-results`

The default Cypress terminal output is kept as the main reporting path.

If you only want Cypress's built-in output, remove the `allureCypress(...)` call in `cypress.config.ts`.

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

If a team uses AI to extend the framework or add specs, load `AI_CONTEXT.md` first so the model keeps selectors, commands, and assertions in the right places.

## Add a new test

Create tests under `cypress/e2e/`.

Keep the pattern simple:

- create data with `DataFactory`
- interact through custom commands or page modules
- assert in the test

Example shape:

```ts
import { loadAppConfig } from '../support/app-config';

it('does something', () => {
  const appConfig = loadAppConfig();
  const dataFactory = new DataFactory('local');
  const person = dataFactory.person();

  cy.signIn(appConfig.credentials.username, appConfig.credentials.password);
  cy.addPerson(person);
});
```

## Extend the framework

Common extension points:

- update or replace the bundled demo app under `demo-apps/`
- add page modules under `cypress/support/pages/`
- add shared custom commands in `cypress/support/commands.ts`
- extend generic data builders in `cypress/support/data/`
- add stronger lint rules in `eslint.config.mjs`

Recommended rules:

- keep selectors in support/page modules or custom commands
- keep assertions in spec files
- use Cypress commands for workflows, not giant helper classes
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

The included workflow lives at:

```bash
.github/workflows/cypress-tests.yml
```

It installs dependencies, starts the bundled demo app, runs Cypress tests, and uploads screenshots and videos as artifacts.
