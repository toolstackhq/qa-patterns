#!/usr/bin/env bash
set -euo pipefail

stdout_file="$(mktemp)"
stderr_file="$(mktemp)"

cleanup() {
  rm -f "$stdout_file" "$stderr_file"
}

trap cleanup EXIT

rm -rf reports/allure

if ! node "$(npm root)/allure/cli.js" \
  classic \
  --config ./allurerc.mjs \
  --output reports/allure \
  --single-file \
  allure-results >"$stdout_file" 2>"$stderr_file"; then
  cat "$stdout_file"
  cat "$stderr_file" >&2
  exit 1
fi

rm -f reports/allure/summary.json

cat "$stdout_file"
echo "Allure report generated at reports/allure/index.html"
