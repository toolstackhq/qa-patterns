# Agent Layer

`qa-patterns` already gives generated projects two things that matter for LLMs:

- `AI_CONTEXT.md`: the framework rules in plain markdown
- `AGENTS.md`: a thin pointer for tools that look for agent instructions

That is enough for most day-to-day usage. An agent layer is the next step up: a repeatable workflow that gives an LLM the right context, the right task, and the right output shape.

## What an agent actually is

For this repo, think of an agent as 4 parts working together:

1. A goal
2. Context
3. Tools
4. A review step

Example:

- Goal: "add a new smoke test for person search"
- Context: `AI_CONTEXT.md`, existing tests, page objects, config, and commands
- Tools: scaffold, file edits, test runs, diffs
- Review step: human checks the patch before merge

That is more useful than vague "multi-agent" talk.

## Where an agent layer fits in qa-patterns

The generated templates should stay simple. They should not ship with a heavy agent runtime by default.

The better model is:

- generated project = stable framework starter
- agent layer = optional workflow on top of that starter

That keeps the templates easy for humans and still makes them useful for AI-assisted work.

## The 3 useful agent jobs

These are the agent jobs that are actually worth building first.

### 1. New test draft

Input:

- requirement or user story
- existing project files
- `AI_CONTEXT.md`

Output:

- a draft test
- any needed page-object changes
- a short explanation of what changed

Use it for:

- adding a new journey
- adding a regression test
- converting a manual checklist into a first draft

### 2. Page-object update

Input:

- failing selector or changed UI
- relevant page object
- failing test output

Output:

- a focused page-object patch
- small test updates only if needed

Use it for:

- UI text changes
- selector drift
- readiness/wait issues

### 3. CI failure triage

Input:

- failing job logs
- changed files
- test artifacts

Output:

- likely root cause
- suggested fix
- optional patch for the safe cases

Use it for:

- flaky readiness failures
- broken config after dependency updates
- reporter or environment issues

## Why not start with many personas

You can invent roles like:

- tech lead
- automation engineer
- devops engineer

But that usually fragments the context too early.

Most teams do better with:

- one strong shared framework guide
- one task-specific workflow
- one human review step

Multi-agent setups become useful only when the work is truly decomposable, for example:

- requirement analysis
- coverage planning
- test draft generation
- patch review

That is real, but it should be earned by actual complexity, not added for show.

## The pieces in plain language

### Goal

The instruction you give the agent.

Example:

- "Add a new API test for creating a person"
- "Update the login page object for the new button text"
- "Explain why the Cypress smoke test failed in CI"

### Context pack

The files and rules the agent needs before it can make good changes.

For `qa-patterns`, a context pack should usually include:

- `AI_CONTEXT.md`
- `AGENTS.md`
- the relevant test file
- the relevant page object or support module
- runtime config
- the exact command used to validate the change

This matters more than the model name. Good context beats fancy prompting.

### Tools

Tools are the deterministic actions around the model.

Examples:

- scaffold a project
- read files
- edit files
- run lint
- run typecheck
- run tests
- collect artifacts

In this repo, the MCP server is already one of those tools. It gives an LLM a reliable way to scaffold instead of wasting tokens generating boilerplate.

### Orchestrator

The orchestrator decides the sequence.

Example sequence:

1. collect context
2. ask the agent for a draft
3. apply the patch
4. run validation commands
5. summarize the result

This can be a script, a local command, a CI workflow, or a coding agent.

### Review gate

The point where a human looks at the result before trusting it.

For test automation, this is important because an LLM can make a test pass in the wrong way:

- weakening assertions
- adding sleeps
- duplicating selectors
- hiding the real failure

The review gate is what keeps the agent useful instead of dangerous.

## What qa-patterns should do next

The practical next step is not a big multi-agent runtime. It is a small, disciplined agent workflow.

Recommended first version:

1. Keep shipping `AI_CONTEXT.md` and `AGENTS.md` in every template
2. Add one repo-level "new test draft" workflow
3. Add one repo-level "CI failure triage" workflow
4. Keep both human-reviewed

That is enough to make the repo genuinely agent-friendly.

## Example flow

Here is a simple, realistic flow for a generated `Playwright` project.

1. The team writes:
   "Add a smoke test for searching an existing person."
2. The agent loads:
   - `AI_CONTEXT.md`
   - existing `PeoplePage`
   - existing smoke tests
   - the commands for lint, typecheck, and test
3. The agent proposes:
   - one new test
   - one small page-object addition if needed
4. Validation runs:
   - lint
   - typecheck
   - test
5. A human reviews the patch and merges it

That is an agent doing useful work inside framework boundaries.

## What to avoid

Avoid these patterns:

- shipping a large agent runtime inside every generated template
- roleplay-heavy persona files with overlapping instructions
- letting the agent write tests without framework context
- auto-merging fixes that weaken the suite

Those things look impressive in demos and age badly in real teams.

## Bottom line

For `qa-patterns`, the right agent strategy is:

- deterministic scaffolding through the CLI or MCP
- framework rules shipped inside generated projects
- small task-focused agent workflows on top
- human review before merge

That is real value, not showmanship.
