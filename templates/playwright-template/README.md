# Playwright Template

This template demonstrates a maintainable Playwright automation architecture without forcing a heavy demo domain up front.

## Highlights

- TypeScript-first framework structure with page objects, fixtures, utilities, and environment-aware configuration.
- Generic test data generation using deterministic factories and generators.
- Environment and secret abstractions that resolve values per `TEST_ENV`.
- Architecture guardrails enforced with local ESLint rules.
- CI-ready reporting with the default Playwright HTML report, optional Allure reporting, JSONL execution events, traces, screenshots, and video artifacts on failure.

## Structure

```text
playwright-template
├── tests
├── pages
├── components
├── fixtures
├── data
│   ├── factories
│   └── generators
├── config
├── utils
├── reporters
├── lint
├── scripts
├── docker
└── .github/workflows
```

## Running locally

1. Copy `.env.example` to `.env` if you need overrides.
2. Start the demo applications from the repository root:
   - `npm run dev:ui`
   - `npm run dev:api`
3. Install workspace dependencies from the repository root with `npm install`.
4. Run tests from this directory with `npm test`.

## Reporting

- The default report remains Playwright's HTML reporter at `reports/html`.
- Allure is also wired in and writes raw execution data to `allure-results`.
- Generate the richer single-file Allure report with `npm run report:allure`.
- The generated Allure report is written to `reports/allure/index.html`.
- Open the generated reports with `npm run report:playwright` or `npm run report:allure:open`.
- If you do not want Allure, remove the `allure-playwright` reporter line in [`playwright.config.ts`](./playwright.config.ts).

## Design rules

- Tests describe short workflows and assertions only.
- Page objects own selectors.
- Page objects return state; assertions stay in test files.
- The starter example should stay small enough to understand in one read.
- `waitForTimeout` is forbidden.
- Tags such as `@smoke`, `@regression`, and `@critical` are used for targeted runs.

## CI usage

- `scripts/run-tests.sh` is the CI entrypoint.
- The included GitHub Actions workflow validates the template twice: once directly on the runner and once by building and running `docker/Dockerfile`.
- `docker/Dockerfile` is therefore a first-class CI path, not just a reference artifact.
- Both CI paths upload Playwright artifacts and Allure outputs so teams can inspect failures without rerunning locally.
