#!/bin/sh
# Generates the multichain backend client (typescript-fetch) into
# src/multichainApiGenerated.
#
# For now the OpenAPI spec is vendored at resource/multichain-openapi.yml
# (synced by hand from the iOS app's multichain_apigen/openapi.yml — the
# archived tonkeeper/multichain_backend repo swagger is stale). Once the current
# backend repo + access token are available, replace the `-i` local file with a
# fetch (e.g. GitLab raw + PRIVATE-TOKEN, or GitHub raw + token) so the spec is
# pulled fresh instead of vendored.
set -eu

exec /usr/local/bin/docker-entrypoint.sh generate \
    -i /local/resource/multichain-openapi.yml \
    -g typescript-fetch \
    -o /local/src/multichainApiGenerated \
    -p supportsES6=true,withInterfaces=true \
    --global-property apis,models,supportingFiles,apiDocs=false,modelDocs=false \
    --openapi-normalizer KEEP_ONLY_FIRST_TAG_IN_OPERATION=true
