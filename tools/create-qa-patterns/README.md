# @toolstackhq/create-qa-patterns

CLI for generating QA framework templates from `qa-patterns`.

## Install

```bash
npm install -g @toolstackhq/create-qa-patterns
```

## Usage

```bash
create-qa-patterns
```

Generate into a new directory:

```bash
create-qa-patterns my-project
```

Generate the Playwright template explicitly:

```bash
create-qa-patterns playwright-template my-project
```

## Supported templates

- `playwright-template`

## Interactive flow

When run in a terminal, the CLI shows:

- a template picker with keyboard selection
- short template descriptions
- scaffold progress while files are generated
- optional post-generate actions for:
  - `npm install`
  - `npx playwright install`
  - `npm test`

## Prerequisite checks

The CLI checks:

- required Node.js version
- `npm` availability for install and test actions
- `npx` availability for Playwright browser installation
- `docker` availability and warns if it is missing
