#!/usr/bin/env bash
set -euo pipefail

node ./scripts/ensure-local-env.mjs
npm run lint
npm run typecheck
npm test -- "$@"
