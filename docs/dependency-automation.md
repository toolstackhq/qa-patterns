# Dependency Automation

## Overview

This repository includes two workflows for dependency maintenance:

- `dependency-monitor.yml`
- `dependency-repair-agent.yml`

The monitor checks:

- whether `@playwright/test` is behind the latest stable version
- whether `npm audit` reports vulnerabilities

The repair agent runs only after a dependency PR fails normal CI.

## Dependency monitor

Workflow:

```bash
.github/workflows/dependency-monitor.yml
```

Behavior:

- runs on a schedule and by manual dispatch
- checks the current Playwright version in `templates/playwright-template`
- checks `npm audit`
- opens a PR when a newer Playwright version is available
- labels that PR with:
  - `dependencies`
  - `ai-repair-allowed`
- creates or updates an issue titled `Dependency monitor report` when vulnerabilities are found

## Dependency repair agent

Workflow:

```bash
.github/workflows/dependency-repair-agent.yml
```

Behavior:

- listens for failed runs of `Repository Validation`
- only acts on PRs that are:
  - on `deps/*` or `dependabot/*` branches
  - or labeled `ai-repair-allowed`
- skips PRs already labeled `ai-repair-attempted`
- collects:
  - failed CI logs
  - changed files in the PR
  - the required validation commands
- prepares an AI repair prompt bundle under `.github/ai-repair`
- uploads that bundle as a workflow artifact
- runs the configured AI repair command if available
- reruns validation
- pushes a repair commit back to the same PR branch if validation passes

## Required configuration

The repair workflow is intentionally provider-agnostic.

Configure these before enabling it:

- repository variable: `AI_REPAIR_COMMAND`
- repository secret: `OPENAI_API_KEY`

`AI_REPAIR_COMMAND` should be the exact shell command that runs your AI agent in GitHub Actions.

The workflow provides these files to that command:

- `.github/ai-repair/prompt.md`
- `.github/ai-repair/context.json`

## Guardrails

The repair workflow is designed to stay narrow:

- it only runs after CI failure on dependency PRs
- it does not publish releases
- it does not run on normal feature PRs
- it labels attempted PRs with `ai-repair-attempted`
- it adds `needs-human-review` when no safe automated repair is produced

## Validation commands

The repair workflow reruns:

```bash
npm run test --workspace @toolstackhq/create-qa-patterns
npm run lint --workspace @toolstackhq/playwright-template
npm run typecheck --workspace @toolstackhq/playwright-template
npm pack --workspace @toolstackhq/create-qa-patterns
node --check templates/playwright-template/demo-apps/ui-demo-app/src/server.js
node --check templates/playwright-template/demo-apps/api-demo-server/src/server.js
```

## Recommended schedule

Start with weekly execution:

- Monday morning UTC

If the repo changes rapidly, move to daily later.
