# qa-patterns

`qa-patterns` is a pattern library for modern automation testing frameworks and deterministic reference applications.

It includes:

- A production-ready Playwright template built with TypeScript.
- A deterministic UI demo application for end-to-end automation.
- A deterministic Express API server for API workflow automation.
- Documentation and CI assets that make the repository easy to extend.

## Repository layout

```text
qa-patterns
├── .github/workflows
├── docs
├── templates
│   └── playwright-template
├── test-apps
│   ├── api-demo-server
│   └── ui-demo-app
├── tools
│   └── create-qa-patterns
├── package.json
└── README.md
```

## Quick start

1. Install dependencies from the repository root:

   ```bash
   npm install
   ```

2. Start the deterministic demo applications in separate terminals:

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

## Usage pattern

This repository is meant to be used in two ways:

1. As a reference implementation:

   - run the bundled UI and API demo apps
   - execute the Playwright template against them
   - study the page objects, fixtures, data factories, config, lint rules, and CI workflow

2. As a starting point for new automation projects:

   - copy or adapt `templates/playwright-template`
   - replace the demo app URLs with your system URLs through `TEST_ENV` config
   - extend `pages/`, `components/`, `fixtures/`, and `data/` around your own business workflows
   - keep selectors in page objects and keep raw test data generation inside factories

The future CLI package is the distribution point for scaffolded starters:

```bash
npm install -g @toolstackhq/create-qa-patterns
create-qa-patterns
```

Today the CLI is a placeholder. The repository itself is the primary usable artifact.

## Release pattern

The repository now follows the same release approach used in `mockit` for the publishable CLI package:

1. Update [`tools/create-qa-patterns/package.json`](./tools/create-qa-patterns/package.json) with the next version.
2. Commit the change to `main`.
3. Create and push a matching git tag such as `v0.1.0`.
4. GitHub Actions runs [`release-publish.yml`](./.github/workflows/release-publish.yml), validates the tag against the CLI package version, packs the artifact, publishes to npm with provenance, and creates a GitHub release.

Required secret:

- `NPM_TOKEN` with publish access for `@toolstackhq/create-qa-patterns`

## What the Playwright template demonstrates

- Tests modeled as business workflows rather than selector scripts.
- Page objects and reusable components that own all locators.
- Deterministic test data via factories, generators, and schemas.
- Environment-aware config and extensible secret resolution.
- CI-friendly observability through traces, screenshots, videos, structured logs, and artifact uploads.
- ESLint rules that protect the automation architecture.

## Documentation

- [Architecture](./docs/architecture.md)
- [Local development](./docs/local-development.md)
- [Extending the repository](./docs/extending-the-repository.md)
- [Playwright template guide](./templates/playwright-template/README.md)

## Default local credentials

- Username: `tester`
- Password: `Password123!`

## Notes

- The UI demo app and API demo server both keep state in memory for deterministic runs.
- The root GitHub Actions workflow runs the Playwright template against the bundled demo applications.
- The `tools/create-qa-patterns` package is a future scaffolding entrypoint.
