#!/bin/bash
set -e

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "error: GITHUB_TOKEN env var is required (passed via --build-arg GITHUB_TOKEN)" >&2
    exit 1
fi

WORKDIR="."
TONAPI_FILE="./tonapi.yml"
BATTERY_API_FILE="./battery-api.yml"
OUTPUT_FILE="./battery-api.yml"

echo "Downloading Swagger files..."
curl -fsSL "https://raw.githubusercontent.com/tonkeeper/opentonapi/refs/heads/master/api/openapi.yml" -o "$WORKDIR/tonapi.yml"
# custodial-battery is private: raw.githubusercontent.com ignores a `?token=` query and answers a
# 404 page, so the file comes through the contents API with the token as a header.
curl -fsSL \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github.raw" \
    "https://api.github.com/repos/tonkeeper/custodial-battery/contents/api/battery-api.yml?ref=master" \
    -o "$WORKDIR/battery-api.yml"

if [[ ! -s "$WORKDIR/tonapi.yml" || ! -s "$WORKDIR/battery-api.yml" ]]; then
  echo "Error: Failed to download Swagger files."
  exit 1
fi

echo "Updating battery-api.yml..."
yq eval '(.paths."/wallet/emulate".post.responses."200".content."application/json".schema) = { "$ref": "./tonapi.yml#/components/schemas/MessageConsequences" }' "$WORKDIR/battery-api.yml" -i
sed -i 's|$ref: ./tonapi.yml#/components/schemas/MessageConsequences|$ref: "./tonapi.yml#/components/schemas/MessageConsequences"|g' "$WORKDIR/battery-api.yml"

echo "Swagger files processed successfully!"

