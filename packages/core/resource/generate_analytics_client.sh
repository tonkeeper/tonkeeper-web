#!/bin/sh
# Regenerates the analytics event types from tonkeeper/analytics-schemas.
#
# Pipeline:
#   1. clone the private analytics-schemas repo to a temp dir using $GITHUB_TOKEN
#   2. patch broken local $refs (see preprocess-analytics-schemas.js)
#   3. bundle the multi-file OpenAPI doc with @redocly/cli
#   4. run openapi-typescript-codegen to produce ./src/analytics/generated/
#   5. prune the 1:1 Xxx -> XxxSchema alias files (prune-redundant-aliases.js)
#   6. emit ./src/analytics/events.ts with the discriminated union
#
# Run from packages/core (matches the other generate:* yarn scripts).
set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CORE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$CORE_DIR/src/analytics/generated"
WRAPPER_OUT="$CORE_DIR/src/analytics/events.ts"

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "error: GITHUB_TOKEN env var is required to regenerate analytics types" >&2
    echo "" >&2
    echo "hint: create a fine-grained GitHub PAT with 'Contents: Read' access to" >&2
    echo "      tonkeeper/analytics-schemas, then:" >&2
    echo "" >&2
    echo "        export GITHUB_TOKEN=<your-token>" >&2
    echo "        yarn generate:analytics" >&2
    exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

git clone --depth 1 \
    "https://x-oauth-basic:${GITHUB_TOKEN}@github.com/tonkeeper/analytics-schemas.git" \
    "$TMP/schemas" >/dev/null 2>&1

node "$SCRIPT_DIR/preprocess-analytics-schemas.js" \
    "$TMP/schemas/openapi-client" \
    "$TMP/preprocessed"

npx @redocly/cli bundle \
    "$TMP/preprocessed/analytics.yaml" \
    -o "$TMP/bundled.yaml" \
    --ext yaml

rm -rf "$GENERATED_DIR"
npx openapi-typescript-codegen \
    --input "$TMP/bundled.yaml" \
    --output "$GENERATED_DIR" \
    --useUnionTypes

node "$SCRIPT_DIR/prune-redundant-aliases.js" "$GENERATED_DIR"

node "$SCRIPT_DIR/generate-analytics-wrapper.js" \
    "$TMP/schemas/openapi-client" \
    "$WRAPPER_OUT"

echo "analytics types regenerated: $GENERATED_DIR + $WRAPPER_OUT"
