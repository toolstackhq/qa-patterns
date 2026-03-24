# CI And Quality Checks

## GitHub Actions

The main workflow is:

```bash
.github/workflows/playwright-tests.yml
```

It does two kinds of validation:

- runs the Playwright, Cypress, and WebdriverIO templates directly on the GitHub runner
- builds and runs the Playwright, Cypress, and WebdriverIO Docker images
- generates optional Allure output for all three framework templates

That means all three framework templates are validated continuously, and each container path is tested instead of drifting as a sample-only artifact.

There is also a lightweight scheduled watcher:

```bash
.github/workflows/dependency-watch.yml
```

It runs weekly and by manual dispatch. It checks whether `@playwright/test` is behind the latest stable version and audits the Playwright and Cypress template lockfiles separately. When something needs attention, it creates or updates a GitHub issue titled `Dependency watch alert`.

Generated projects are validated separately in:

```bash
.github/workflows/generated-template-validation.yml
```

That workflow packs the published CLI artifact, scaffolds fresh Playwright, Cypress, and WebdriverIO projects into temporary directories, installs their dependencies, and runs their real validation commands. This protects the npm package path instead of only checking the templates inside the monorepo.

It also includes a smaller `Cypress` happy-path smoke that runs the CLI with `--yes` end to end. That job exists to prove the default scaffold experience works, while the main generated-project jobs keep failures easier to diagnose.

## CI entrypoints

Template CI commands:

```bash
templates/playwright-template/scripts/run-tests.sh
templates/cypress-template/scripts/run-tests.sh
templates/wdio-template/scripts/run-tests.sh
```

## Quality checks

From the repository root:

```bash
npm run lint
npm run typecheck
```

The template lint rules enforce framework conventions such as:

- no raw locators in tests
- no `waitForTimeout`
- no assertions inside page objects

## Docker

Dockerfiles live at:

```bash
templates/playwright-template/docker/Dockerfile
templates/cypress-template/docker/Dockerfile
templates/wdio-template/docker/Dockerfile
```

They are intended for CI portability across systems outside GitHub Actions as well.

## Release workflow

The CLI release workflow is:

```bash
.github/workflows/release-publish.yml
```

It publishes:

- `@toolstackhq/create-testkit`

when a matching `v*.*.*` tag is pushed.
