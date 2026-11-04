#!/bin/sh
set -eu

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "error: GITHUB_TOKEN env var is required (pass it via 'docker run -e GITHUB_TOKEN')" >&2
    exit 1
fi

BRANCH="${SWAPS_BACKEND_BRANCH:-main}"

exec /usr/local/bin/docker-entrypoint.sh generate \
    -i "https://raw.githubusercontent.com/tonkeeper/swaps_backend_go/refs/heads/${BRANCH}/swagger.yaml?token=${GITHUB_TOKEN}" \
    -g typescript-fetch \
    -o /local/src/swapsApiGenerated \
    -p supportsES6=true,withInterfaces=true,withoutRuntimeChecks=true \
    --global-property apis,models,supportingFiles,apiDocs=false,modelDocs=false \
    --openapi-normalizer KEEP_ONLY_FIRST_TAG_IN_OPERATION=true
