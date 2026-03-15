# Architecture

`qa-patterns` is organized as an npm workspace so teams can install once at the repository root and then run any template or demo application in isolation.

## Repository modules

- `templates/playwright-template`: Reference automation framework with Playwright, TypeScript, fixtures, page objects, data factories, environment configuration, and CI assets.
- `test-apps/ui-demo-app`: Deterministic server-rendered banking UI used for end-to-end tests.
- `test-apps/api-demo-server`: Deterministic Express API used for API workflow tests.
- `tools/create-qa-patterns`: Placeholder CLI package for future project scaffolding.
- `docs`: Architecture, local setup, and extension guidance.

## Playwright template layers

- `tests`: Business journeys and workflow validation only.
- `pages`: Screen-level page objects that own selectors and business actions.
- `components`: Reusable UI fragments such as navigation and flash messages.
- `fixtures`: Composition root for runtime configuration, logging, data factories, and page objects.
- `data`: Schemas, deterministic generators, and domain factories.
- `config`: Environment resolution and secret abstractions.
- `utils`: Logging and step instrumentation.
- `reporters`: CI-facing execution reporters.
- `lint`: Local ESLint plugin that protects the architecture.

## Determinism strategy

- The demo applications store state in memory and expose fixed ports by default.
- The Playwright template uses a `TEST_RUN_ID` to generate stable IDs for each run.
- Environment defaults are explicit, and `.env` files can override them per environment.
- Page objects use semantic selectors or `data-testid`, which keeps tests resilient and readable.
