# MCP Server

This package exposes `qa-patterns` as a small MCP server.

It is designed for LLM clients that should scaffold and validate projects without regenerating boilerplate in the prompt.

Supported templates:

- `playwright-template`
- `cypress-template`
- `wdio-template`

Run it locally from the repo root:

```bash
npm install
npm run mcp:start
```

Tools exposed:

- `list_templates`
- `describe_template`
- `scaffold_template`
- `validate_project`
- `get_next_steps`
