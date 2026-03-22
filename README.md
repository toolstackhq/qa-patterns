# qa-patterns

[![Repository Validation (Greybox)](https://github.com/toolstackhq/qa-patterns/actions/workflows/playwright-tests.yml/badge.svg?branch=main)](https://github.com/toolstackhq/qa-patterns/actions/workflows/playwright-tests.yml)
[![Generated Template Validation (Blackbox)](https://github.com/toolstackhq/qa-patterns/actions/workflows/generated-template-validation.yml/badge.svg?branch=main)](https://github.com/toolstackhq/qa-patterns/actions/workflows/generated-template-validation.yml)
[![MCP Server Validation](https://github.com/toolstackhq/qa-patterns/actions/workflows/mcp-server.yml/badge.svg?branch=main)](https://github.com/toolstackhq/qa-patterns/actions/workflows/mcp-server.yml)
[![Dependency Watch](https://github.com/toolstackhq/qa-patterns/actions/workflows/dependency-watch.yml/badge.svg?branch=main)](https://github.com/toolstackhq/qa-patterns/actions/workflows/dependency-watch.yml)
[![Docs Site](https://img.shields.io/badge/docs-live-0f766e)](https://toolstackhq.github.io/qa-patterns/)
[![npm version](https://img.shields.io/npm/v/%40toolstackhq%2Fcreate-qa-patterns)](https://www.npmjs.com/package/@toolstackhq/create-qa-patterns)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.18.0-339933?logo=node.js&logoColor=white)](./package.json)

`qa-patterns` is a project scaffolding tool for modern test automation frameworks.

Supported projects today:

- `Playwright`
- `Cypress`
- `WebdriverIO`

## Table of contents

- [Feature matrix](#feature-matrix)
- [Use as npm CLI](#use-as-npm-cli)
- [Use as MCP server](#use-as-mcp-server)
- [Detailed documentation](#detailed-documentation)
- [Contributing](#contributing)

## Feature matrix

| Feature                               | Playwright | Cypress | WebdriverIO |
| ------------------------------------- | ---------- | ------- | ----------- |
| TypeScript template                   | **YES**    | **YES** | **YES**     |
| Built-in sample app for local testing | **YES**    | **YES** | **YES**     |
| API example                           | **YES**    | -       | -           |
| Data factory                          | **YES**    | **YES** | **YES**     |
| Page objects / page modules           | **YES**    | **YES** | **YES**     |
| Multi-environment support             | **YES**    | **YES** | **YES**     |
| Secret management pattern             | **YES**    | **YES** | **YES**     |
| Linting checks                        | **YES**    | **YES** | **YES**     |
| CI workflow                           | **YES**    | **YES** | **YES**     |
| Optional Allure report                | **YES**    | **YES** | **YES**     |
| Docker support                        | **YES**    | -       | -           |
| MCP scaffolding support               | **YES**    | **YES** | **YES**     |
| AI-ready template guidance            | **YES**    | **YES** | **YES**     |
| Safe template upgrade checks          | **YES**    | **YES** | **YES**     |

## Use as npm CLI

[![qa-patterns CLI walkthrough](./docs/assets/termynal-cli-preview.svg)](https://toolstackhq.github.io/qa-patterns/#cli)

Open the docs site for the live animated terminal walkthrough built with a Termynal-style interaction:

- [Animated CLI walkthrough](https://toolstackhq.github.io/qa-patterns/#cli)

```bash
# Run the scaffolder
npx @toolstackhq/create-qa-patterns
```

```text
? Select a template
? Target directory
? Run npm install now?
? Run npx playwright install now?   # Playwright only
? Run npm test now?
```

```bash
# Scaffold Playwright directly
npx @toolstackhq/create-qa-patterns playwright-template my-project
```

```bash
# Scaffold Cypress directly
npx @toolstackhq/create-qa-patterns cypress-template my-project
```

```bash
# Scaffold WebdriverIO directly
npx @toolstackhq/create-qa-patterns wdio-template my-project
```

```bash
# Check for safe managed-template updates later
npx -y @toolstackhq/create-qa-patterns upgrade check .
```

```bash
# Apply only safe managed-template updates
npx -y @toolstackhq/create-qa-patterns upgrade apply --safe .
```

## Use as MCP server

Use the MCP server when you want an LLM to scaffold projects deterministically instead of generating framework boilerplate from scratch.

Generated templates also include:

- `AI_CONTEXT.md` for any LLM
- `AGENTS.md` as a thin pointer for tools that look for agent instructions

That means the generated project already carries framework-specific guidance for adding tests, updating page objects, and maintaining CI without the model inventing its own structure.

<details>
<summary>Codex</summary>

Add this to your Codex MCP config:

```json
{
  "mcpServers": {
    "qa-patterns": {
      "command": "/absolute/path/to/node",
      "args": [
        "/absolute/path/to/qa-patterns/packages/mcp-server/src/index.mjs"
      ],
      "cwd": "/absolute/path/to/qa-patterns"
    }
  }
}
```

If you use `nvm`, get the Node binary path with `nvm which 24`.

Prompt example:

```text
Create a Playwright framework in /tmp/pw-demo without installing dependencies.
```

</details>

<details>
<summary>Claude Code</summary>

Anthropic documents Claude Code MCP servers in a project `.mcp.json` file. Reference: [Connect Claude Code to tools via MCP](https://docs.anthropic.com/en/docs/claude-code/mcp).

```json
{
  "mcpServers": {
    "qa-patterns": {
      "command": "/absolute/path/to/node",
      "args": [
        "/absolute/path/to/qa-patterns/packages/mcp-server/src/index.mjs"
      ],
      "cwd": "/absolute/path/to/qa-patterns"
    }
  }
}
```

If you use `nvm`, get the Node binary path with `nvm which 24`.

Prompt example:

```text
Describe the playwright-template and scaffold it in ./my-framework.
```

</details>

## Detailed documentation

- [Docs index](./docs/README.md)
- [MCP docs site](https://toolstackhq.github.io/qa-patterns/)
- [Run locally](./docs/local-development.md)
- [Framework architecture](./docs/architecture.md)
- [Agent layer](./docs/agent-layer.md)
- [Write and extend tests](./docs/extending-the-repository.md)
- [Reporting](./docs/reporting.md)
- [CI and quality checks](./docs/ci-and-quality.md)
- [Security and secrets](./docs/security.md)
- [MCP server package](./packages/mcp-server/README.md)
- [Playwright template README](./templates/playwright-template/README.md)
- [Cypress template README](./templates/cypress-template/README.md)
- [WebdriverIO template README](./templates/wdio-template/README.md)

## Contributing

Open an issue or PR if you want to add:

- a new framework template
- shared upgrade logic
- new MCP tooling
- stronger CI or reporting patterns
