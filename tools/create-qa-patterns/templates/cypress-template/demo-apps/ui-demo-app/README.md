# UI Demo App

This app exists only to make the generated framework runnable out of the box.

What it does:

- serves a login page
- serves a people page
- accepts login using credentials from the project root `.env`
- supports adding and searching people
- exposes `/health` for test startup checks

Credentials:

- username: `UI_DEMO_USERNAME` or `DEV_APP_USERNAME`
- password: `UI_DEMO_PASSWORD` or `DEV_APP_PASSWORD`

Those values are generated into the generated project's root `.env` file the
first time you run the framework commands.

Example:

```bash
cat .env
```

Look for:

```bash
DEV_APP_USERNAME=...
DEV_APP_PASSWORD=...
```

This app is sample infrastructure only. Teams can delete or replace it once
they point the framework at a real environment.
