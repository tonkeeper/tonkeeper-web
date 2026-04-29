#!/bin/sh
# Preflight used by yarn generate:* scripts that pull a swagger.yaml from a
# private tonkeeper/* GitHub repo. Keeps secrets out of package.json and
# Dockerfiles by requiring the token to come from the user's shell env.
set -eu

if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "error: GITHUB_TOKEN env var is required to regenerate this API client" >&2
    echo "" >&2
    echo "hint: create a fine-grained GitHub PAT with 'Contents: Read' access to" >&2
    echo "      the relevant tonkeeper/* backend repo, then:" >&2
    echo "" >&2
    echo "        export GITHUB_TOKEN=<your-token>" >&2
    echo "        yarn generate:<target>" >&2
    exit 1
fi
