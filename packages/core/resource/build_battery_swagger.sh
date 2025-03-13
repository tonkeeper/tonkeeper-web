#!/bin/bash
set -e

WORKDIR="."
TONAPI_FILE="./tonapi.yml"
BATTERY_API_FILE="./battery-api.yml"
OUTPUT_FILE="./battery-api.yml"

echo "Downloading Swagger files..."
curl -sSL "https://raw.githubusercontent.com/tonkeeper/opentonapi/refs/heads/master/api/openapi.yml" -o "$WORKDIR/tonapi.yml"
curl -sSL "https://raw.githubusercontent.com/tonkeeper/custodial-battery/refs/heads/master/api/battery-api.yml?token=${GITHUB_TOKEN}" -o "$WORKDIR/battery-api.yml"

if [[ ! -s "$WORKDIR/tonapi.yml" || ! -s "$WORKDIR/battery-api.yml" ]]; then
  echo "Error: Failed to download Swagger files."
  exit 1
fi

echo "Updating battery-api.yml..."
yq eval '(.paths."/wallet/emulate".post.responses."200".content."application/json".schema) = { "$ref": "./tonapi.yml#/components/schemas/MessageConsequences" }' "$WORKDIR/battery-api.yml" -i
sed -i 's|$ref: ./tonapi.yml#/components/schemas/MessageConsequences|$ref: "./tonapi.yml#/components/schemas/MessageConsequences"|g' "$WORKDIR/battery-api.yml"

echo "Swagger files processed successfully!"

