#!/bin/sh
# Runs inside the openapi-generator-cli container. Appends the $GITHUB_TOKEN
# (supplied via `docker run -e GITHUB_TOKEN`) to the swagger URL at container
# start time so the secret never ends up baked into any Dockerfile, image
# layer or yarn script.
#
# Usage: generate_openapi_client.sh <swagger_raw_url> <output_dir>
#   <swagger_raw_url>  raw.githubusercontent.com URL WITHOUT the ?token=... suffix
#   <output_dir>       absolute path inside the container (e.g. /local/src/<name>)
set -eu

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "error: GITHUB_TOKEN env var is required (pass it via 'docker run -e GITHUB_TOKEN')" >&2
    exit 1
fi

SWAGGER_URL="$1"
OUTPUT_DIR="$2"

exec /usr/local/bin/docker-entrypoint.sh generate \
    -i "${SWAGGER_URL}?token=${GITHUB_TOKEN}" \
    -g typescript-fetch \
    -o "$OUTPUT_DIR" \
    -p supportsES6=true,withInterfaces=true \
    --openapi-normalizer KEEP_ONLY_FIRST_TAG_IN_OPERATION=true
