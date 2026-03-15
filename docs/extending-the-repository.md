# Extending The Repository

## Adding a new framework template

1. Create a new package under `templates/`.
2. Keep framework-specific docs and CI files inside that template package.
3. Add the package path to the root `workspaces` array.
4. Provide at least one deterministic reference test against the demo applications or a new demo system.

## Adding new demo apps

1. Place the application under `test-apps/`.
2. Keep the state model deterministic and reset on process start.
3. Expose a `/health` endpoint so CI can wait for service readiness.
4. Document the expected ports and credentials.

## Evolving the Playwright template

- Add new domain factories under `data/factories`.
- Add shared UI primitives under `components`.
- Keep locators out of `tests`.
- Update the local ESLint plugin when new architectural rules need to be enforced.

## Future CLI direction

The `create-qa-patterns` package is intentionally minimal today. It is the reserved integration point for future commands such as:

- `create-qa-patterns playwright`
- `create-qa-patterns api`
- `create-qa-patterns demo-app`
