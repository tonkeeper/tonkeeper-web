#!/usr/bin/env bash
# Deterministic gate for agent-written changes: tsc via build:pkg, then eslint on the changed files.
# Prints only the error lines (capped) so a retrying agent gets the failure, not the build log.
# Usage: scripts/agent/gate.sh [base-ref]   (default: origin/main)
set -uo pipefail

base="${1:-origin/main}"
cd "$(git rev-parse --show-toplevel)"
max_lines=60
status=0

tsc_log="$(npx turbo build:pkg --output-logs=errors-only 2>&1)" || status=1
if [[ $status -ne 0 ]]; then
    echo "GATE FAIL: tsc (npx turbo build:pkg)"
    printf '%s\n' "$tsc_log" | grep -E 'error TS[0-9]+|ERR!|Error:' | sort -u | head -n "$max_lines"
    exit 1
fi

changed="$(git diff --name-only --diff-filter=ACMR "$(git merge-base "$base" HEAD)" -- '*.ts' '*.tsx' | grep -v '/dist/' || true)"
count="$(printf '%s' "$changed" | grep -c . || true)"
if [[ "$count" -gt 0 ]]; then
    lint_log="$(printf '%s\n' "$changed" | tr '\n' '\0' | xargs -0 yarn eslint --format unix 2>&1)" || status=1
    if [[ $status -ne 0 ]]; then
        echo "GATE FAIL: eslint ($count changed files)"
        printf '%s\n' "$lint_log" | grep -E '^[^ ]+:[0-9]+:[0-9]+:' | head -n "$max_lines"
        exit 1
    fi
fi

echo "GATE PASS: tsc + eslint ($count changed files)"
