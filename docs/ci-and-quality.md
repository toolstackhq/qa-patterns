# CI And Quality Checks

## GitHub Actions

The main workflow is:

```bash
.github/workflows/playwright-tests.yml
```

It does two kinds of validation:

- runs the Playwright template directly on the GitHub runner
- builds and runs the Playwright Docker image

That means the Docker path is tested continuously, not just included as a sample.

There is also a lightweight scheduled watcher:

```bash
.github/workflows/dependency-watch.yml
```

It runs weekly and by manual dispatch. It checks whether `@playwright/test` is behind the latest stable version and whether `npm audit` reports vulnerabilities. When something needs attention, it creates or updates a GitHub issue titled `Dependency watch alert`.

## CI entrypoint

The Playwright template CI command is:

```bash
templates/playwright-template/scripts/run-tests.sh
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

The Dockerfile lives at:

```bash
templates/playwright-template/docker/Dockerfile
```

It is intended for CI portability across systems outside GitHub Actions as well.

## Release workflow

The CLI release workflow is:

```bash
.github/workflows/release-publish.yml
```

It publishes:

- `@toolstackhq/create-qa-patterns`

when a matching `v*.*.*` tag is pushed.
