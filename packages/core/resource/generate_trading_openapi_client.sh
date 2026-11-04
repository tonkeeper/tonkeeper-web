#!/bin/sh
# Generates the trading backend client (typescript-fetch) into
# src/tradingApiGenerated.
#
# The OpenAPI spec is vendored at resource/trading-openapi.yml (copied from the
# openapi.yaml the trading backend team hands out — see the header in that
# file). Once a canonical backend spec source + access token are available,
# replace the `-i` local file with a fetch so the spec is pulled fresh instead
# of vendored.
set -eu

exec /usr/local/bin/docker-entrypoint.sh generate \
    -i /local/resource/trading-openapi.yml \
    -g typescript-fetch \
    -o /local/src/tradingApiGenerated \
    -p supportsES6=true,withInterfaces=true \
    --global-property apis,models,supportingFiles,apiDocs=false,modelDocs=false \
    --openapi-normalizer KEEP_ONLY_FIRST_TAG_IN_OPERATION=true
