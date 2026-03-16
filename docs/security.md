# Security And Secrets

## Secret resolution

The Playwright template resolves secrets through:

- `SecretProvider`
- `EnvSecretProvider`
- `SecretManager`

These are defined in:

```bash
templates/playwright-template/config/secret-manager.ts
```

## How values are resolved

For `TEST_ENV=dev`, `staging`, or `prod`, the template checks environment-specific keys first, then generic keys.

Examples:

- `DEV_APP_USERNAME`, then `APP_USERNAME`
- `DEV_APP_PASSWORD`, then `APP_PASSWORD`
- `DEV_UI_BASE_URL`, then `UI_BASE_URL`
- `DEV_API_BASE_URL`, then `API_BASE_URL`

If no environment variable is present, the template falls back to the defaults defined in:

```bash
templates/playwright-template/config/environments.ts
```

That means the tests always need two things:

- reachable application endpoints
- credentials that match the selected environment

If the endpoints or credentials do not match `TEST_ENV`, the tests will fail even though the framework itself is configured correctly.

## Local `.env`

For local development, the template loads:

- `.env`
- `.env.<TEST_ENV>`

from:

```bash
templates/playwright-template
```

## What is and is not built in

Built in:

- environment-aware secret lookup
- `.env` support
- runtime config validation with `zod`

Not built in:

- secret encryption
- external secret stores such as Vault or AWS Secrets Manager

If a team needs encrypted or centralized secrets, the intended extension point is the `SecretProvider` interface.

## Repository safety

- `.env` files should not be committed
- demo credentials are only for the local demo apps
- production values should come from CI or a real secret manager
