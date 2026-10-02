#!/bin/sh
set -eu

# Runs the ui-kit component tests in the same Playwright container CI uses, so
# screenshot baselines generated locally match the ones CI compares against.
# Keep the image tag in sync with @playwright/experimental-ct-react and ui-kit.yaml.
#
#   run         compare against the committed baselines
#   update      rewrite baselines whose diff exceeds the tolerance
#   update-all  rewrite every baseline that changed at all (CT_UPDATE_ALL=1)
#
# Extra args (test files or folders, relative to packages/ui-kit) are forwarded
# to `playwright test`.

MODE="${1:-run}"
shift || true
WORKERS="${CT_WORKERS:-1}"
REPO="$(git rev-parse --show-toplevel)"
AUTH_TOKEN="${NODE_AUTH_TOKEN:-${YARN_NPM_AUTH_TOKEN:-${GITHUB_TOKEN:-}}}"

UPDATE_ALL=""
case "${MODE}" in
    run)
        PW_ARGS="--workers=${WORKERS}"
        ;;
    update)
        PW_ARGS="--workers=${WORKERS} --update-snapshots"
        ;;
    update-all)
        PW_ARGS="--workers=${WORKERS} --update-snapshots"
        UPDATE_ALL="1"
        ;;
    *)
        echo "Unknown mode: ${MODE}. Use one of: run, update, update-all"
        exit 1
        ;;
esac

for arg in "$@"; do
    PW_ARGS="${PW_ARGS} \"${arg}\""
done

# Mount the repo at the same absolute path inside the container as on the host so the
# file paths Playwright prints (expected/actual/diff snapshots) stay clickable.
docker run --rm \
    -e NODE_AUTH_TOKEN="${AUTH_TOKEN}" \
    -e YARN_NPM_AUTH_TOKEN="${AUTH_TOKEN}" \
    -e COREPACK_DEFAULT_TO_LATEST=0 \
    -e CT_UPDATE_ALL="${UPDATE_ALL}" \
    -v "${REPO}:${REPO}" -w "${REPO}" \
    mcr.microsoft.com/playwright:v1.62.1-jammy \
    bash -lc "
        set -euo pipefail
        corepack enable

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

        cd packages/ui-kit
        rm -rf playwright/.cache
        yarn playwright test -c playwright-ct.config.ts ${PW_ARGS}
    "
