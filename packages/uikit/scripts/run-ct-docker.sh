#!/bin/sh
set -eu

MODE="${1:-run}"
shift || true
WORKERS="${CT_WORKERS:-1}"
REPO="$(git rev-parse --show-toplevel)"
AUTH_TOKEN="${NODE_AUTH_TOKEN:-${YARN_NPM_AUTH_TOKEN:-${GITHUB_TOKEN:-}}}"

# update-all: like update, but with CT_UPDATE_ALL=1 the Playwright config zeroes
# the screenshot tolerances, so baselines whose diff would otherwise sit under
# maxDiffPixelRatio (e.g. after a font change) are rewritten too.
UPDATE_ALL=""
case "${MODE}" in
    run)
        EXTRA_ARGS="-- --workers=${WORKERS}"
        ;;
    update)
        EXTRA_ARGS="-- --workers=${WORKERS} --update-snapshots"
        ;;
    update-all)
        EXTRA_ARGS="-- --workers=${WORKERS} --update-snapshots"
        UPDATE_ALL="1"
        ;;
    *)
        echo "Unknown mode: ${MODE}. Use one of: run, update, update-all"
        exit 1
        ;;
esac

# Forward any path filters (a file, a folder, or several) into the container. The
# chunked runner accepts both uikit-relative (src/...) and repo-relative
# (packages/uikit/src/...) forms; without filters it runs the whole suite, split
# into chunks so the CT bundle's memory stays bounded as the suite grows.
CT_ARGS=""
for arg in "$@"; do
    CT_ARGS="${CT_ARGS} \"${arg}\""
done
if [ -z "${CT_ARGS}" ]; then
    CT_ARGS="--all"
fi

# uikit resolves @tonkeeper/core through its compiled dist, which the container
# never builds. A stale dist keeps modules that source no longer has, and those
# can still import packages or subpaths that are gone — the CT bundle then fails
# to resolve them. Rebuilding (core's build wipes dist first) keeps the bundle in
# step with src, the same way CI's build:pkg does.
yarn workspace @tonkeeper/core build

# Mount the repo at the same absolute path inside the container as on the host so the
# file paths Playwright prints (expected/actual/diff snapshots, stack traces) resolve
# on the host and stay clickable from the terminal.
#
# The image tag must match the container in .github/workflows/component-tests.yaml
# (and the @playwright/* version in packages/uikit): screenshot baselines are only
# reproducible against the exact browser builds it ships.
#
# Component tests never launch Electron, so skip its postinstall download; it would
# only pull a Linux binary into the host-mounted node_modules on every run.
docker run --rm \
    -e NODE_AUTH_TOKEN="${AUTH_TOKEN}" \
    -e YARN_NPM_AUTH_TOKEN="${AUTH_TOKEN}" \
    -e COREPACK_DEFAULT_TO_LATEST=0 \
    -e ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    -e CT_CHUNK_SIZE="${CT_CHUNK_SIZE:-}" \
    -e CT_UPDATE_ALL="${UPDATE_ALL}" \
    -v "${REPO}:${REPO}" -w "${REPO}" \
    mcr.microsoft.com/playwright:v1.62.1-jammy \
    bash -lc "
        set -euo pipefail
        corepack enable

        # Mitigate intermittent mount visibility glitches in Docker Desktop.
        mkdir -p \"${REPO}/packages/uikit/src/components/layout\"

        install_ok=0
        for i in 1 2 3; do
            if yarn install --immutable; then
                install_ok=1
                break
            fi
            echo \"[ct-docker] yarn install failed (attempt \$i/3), retrying...\"
            sleep 2
        done

        if [ \"\$install_ok\" -ne 1 ]; then
            echo \"[ct-docker] yarn install failed after retries\"
            exit 1
        fi

        cd packages/uikit
        rm -rf playwright/.cache
        node ../../scripts/test-changed-components.mjs ${CT_ARGS} ${EXTRA_ARGS}
    "
