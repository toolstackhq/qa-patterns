# qa-patterns

`qa-patterns` is a repository of reusable test automation patterns.

It gives teams a clean starting point for building automation frameworks without having to invent the structure from scratch.

## Table of contents

- [Why this repo exists](#why-this-repo-exists)
- [Feature set](#feature-set)
- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [Main commands](#main-commands)
- [Documentation](#documentation)
- [Default local credentials](#default-local-credentials)

It currently includes:

- a Playwright + TypeScript framework template
- a deterministic UI demo app for browser testing
- a deterministic API demo server for API testing
- CI, linting, reporting, and extension patterns

## Why this repo exists

Most automation repositories either start too bare or become too complex too quickly.

This repository aims for a middle ground:

- simple enough to understand quickly
- structured enough to scale
- realistic enough to reuse in real projects
- deterministic enough to run repeatedly in CI

## Feature set

- workflow-first Playwright tests instead of selector-heavy scripts
- page objects that own all locators
- shared fixtures for runtime config, pages, logging, and test data
- generic data factories so tests stay readable
- multi-environment config with `dev`, `staging`, and `prod`
- env-based secret resolution with a replaceable secret provider model
- built-in Playwright HTML reporting
- optional single-file Allure reporting
- structured execution logs for CI diagnostics
- lint rules that protect the framework shape
- Docker and GitHub Actions support

## How it works

- the demo apps provide predictable UI and API targets
- the Playwright template reads environment and secret values at runtime
- tests run against whatever app URLs and credentials match `TEST_ENV`
- page objects keep selector logic out of test files
- reports, traces, screenshots, videos, and logs are saved for local debugging and CI

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Start the demo apps in separate terminals:

```bash
npm run dev:ui
```

```bash
npm run dev:api
```

3. Run the Playwright template:

```bash
npm test
```

## Main commands

From the repository root:

```bash
npm test
npm run test:smoke
npm run test:regression
npm run lint
npm run typecheck
```

From `templates/playwright-template`:

```bash
npm run report:playwright
npm run report:allure
```

## Documentation

- [Docs index](./docs/README.md)
- [Run locally](./docs/local-development.md)
- [Write and extend tests](./docs/extending-the-repository.md)
- [Framework architecture](./docs/architecture.md)
- [Reporting](./docs/reporting.md)
- [CI and quality checks](./docs/ci-and-quality.md)
- [Security and secrets](./docs/security.md)
- [Playwright template package](./templates/playwright-template/README.md)

## Default local credentials

- username: `tester`
- password: `Password123!`
