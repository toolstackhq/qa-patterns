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

The generated project is initialized with `git init` automatically and includes a default `.gitignore` for common local artifacts.

Generate the Playwright template explicitly:

```bash
create-qa-patterns playwright-template my-project
```

Generate the Cypress template explicitly:

```bash
create-qa-patterns cypress-template my-project
```

```bash
create-qa-patterns wdio-template my-project
```

Generate without post-create prompts, which is useful for CI or scripted setup:

```bash
create-qa-patterns playwright-template my-project --yes --no-install --no-setup --no-test
```

## Upgrade a generated project

Generated projects now include a `.qa-patterns.json` metadata file. It tracks the last applied managed template baseline so the CLI can update infrastructure files conservatively later.

Check for safe updates:

```bash
create-qa-patterns upgrade check my-project
```

Apply only safe managed-file updates:

```bash
create-qa-patterns upgrade apply --safe my-project
```

The upgrade flow intentionally avoids overwriting user-owned test and page code. It only manages framework infrastructure such as config, scripts, workflows, and package metadata when those files are still unchanged from the generated baseline.

## Supported templates

- `playwright-template`
- `cypress-template`
- `wdio-template`

## Interactive flow

When run in a terminal, the CLI shows:

- a template picker with keyboard selection
- short template descriptions
- scaffold progress while files are generated
- optional post-generate actions for:
  - `npm install`
  - `npm test`

For Playwright projects, the interactive flow also offers:

- `npx playwright install`

For non-interactive automation, the CLI also supports:

- `--yes`
- `--no-install`
- `--no-setup`
- `--no-test`
- `--template <template>`

## Prerequisite checks

The CLI checks:

- required Node.js version
- `npm` availability for install and test actions
- `npx` availability for template setup that depends on it
- `docker` availability and warns if it is missing
- `git` availability so the scaffold can start as a repository immediately

If `npx playwright install` fails because the host is missing browser dependencies, the CLI keeps the generated project and prints the recovery steps instead of treating scaffold generation as failed.
