#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_dir="${repo_root}/templates/playwright-template/"
target_dir="${repo_root}/tools/create-qa-patterns/templates/playwright-template/"

mkdir -p "${target_dir}"

rsync -a --delete \
  --exclude 'allure-results' \
  --exclude 'reports' \
  --exclude 'test-results' \
  "${source_dir}" "${target_dir}"
