# @toolstackhq/create-testkit

CLI for generating QA framework templates from `testkit`.

## Install

```bash
npm install -g @toolstackhq/create-testkit
```

## Usage

```bash
create-testkit
```

Generate into a new directory:

```bash
create-testkit my-project
```

The generated project is initialized with `git init` automatically and includes a default `.gitignore` for common local artifacts.

Generate the Playwright template explicitly:

```bash
create-testkit playwright-template my-project
```

Generate the Cypress template explicitly:

```bash
create-testkit cypress-template my-project
```

```bash
create-testkit wdio-template my-project
```

Generate without post-create prompts, which is useful for CI or scripted setup:

```bash
create-testkit playwright-template my-project --yes --no-install --no-setup --no-test
```

## Upgrade a generated project

Generated projects now include a `.testkit.json` metadata file. It tracks the last applied managed template baseline so the CLI can update infrastructure files conservatively later.

Check for safe updates:

```bash
create-testkit upgrade check my-project
```

Apply only safe managed-file updates:

```bash
create-testkit upgrade apply --safe my-project
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
