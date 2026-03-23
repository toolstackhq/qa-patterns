# API Demo Server

This API exists only to make the generated framework runnable out of the box.

What it does:

- exposes `GET /health`
- exposes `GET /people`
- exposes `POST /people`
- stores data in memory for the duration of the process

It is intentionally small and disposable. It is not meant to model production
API architecture.

The generated templates use this server only for local demo coverage. Teams can
delete or replace it once they point the framework at a real API.
