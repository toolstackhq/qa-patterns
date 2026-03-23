# Demo Apps

These demo apps are the canonical source for the sample applications bundled into
the generated templates.

- `ui-demo-app/`
  - small login and people-management app for browser testing
- `api-demo-server/`
  - minimal people API for API-focused examples

The template folders under `templates/*/demo-apps` are generated copies of these
apps. If you need to change the shared demo app behavior, update `test-apps/`
first and then run:

```bash
node scripts/sync-templates.mjs
```

Local demo credentials are not hardcoded in the app source. They are generated
into the project root `.env` file on first run.
