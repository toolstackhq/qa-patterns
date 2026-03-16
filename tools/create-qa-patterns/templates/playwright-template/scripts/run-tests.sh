#!/usr/bin/env bash
set -euo pipefail

npm run lint
npm run typecheck
npx playwright test "$@"
