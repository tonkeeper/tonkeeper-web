# tk-impact-analysis

Compares the current branch with the relevant release tag and suggests test cases from the Web regress set based on the code changes.

## What It Does

The skill:

- detects the current branch in the web repository
- fetches release tags and branches from `origin` so the latest release set is available locally
- auto-detects release refs in this priority order:
  1. git tags matching `vX.Y.Z` (e.g. `v4.7.0`), skipping pre-release tags (`rc`, `alpha`, `beta`)
  2. branches matching `release/X.Y.Z` (e.g. `release/4.7.0`) or `release/YY.MM.Iterator`
- compares the current branch with the right release tag automatically:
  - current ref is the latest release → compare with the previous release
  - current ref is an older release → compare with the latest release
  - current ref is not a release → compare with the latest release
- reads the Web regression source from `sources/Web/regress.txt`
- analyzes changed code and maps it to relevant regression coverage
- extracts module and feature names from changed paths and uses them as search terms
- highlights changed files that did not match a known QA area
- recommends which existing regression checks to run
- suggests missing regression blocks to add
- suggests extra exploratory checks based on the diff
- generates:
  - a Markdown report
  - a TXT test collection for the specific run

## Supported Platform

- `Web` (this repository)

## Required Inputs

- `PLATFORM`: always `Web` for this repository

Optional:

- `SOURCE_REPOSITORY`: custom source repository used for git comparison
- `BASE_BRANCH`: override the current checked out branch
- `RELEASE_BRANCH`: override the auto-selected release branch
- `REPO_PATH`: legacy alias for `SOURCE_REPOSITORY`
- `REGRESS_PATH`: custom `regress.txt` path
- `REPORT_PATH`: custom Markdown report path
- `TESTS_COLLECTION_PATH`: custom TXT test collection path

## Default Output Paths

- report template: `report.md`
- tests template: `test-collection-template.txt`
- run report: `reports/<execution-date>/Web/report.md`
- run tests collection: `reports/<execution-date>/Web/test-collection.txt`
- raw git bundle: `reports/<execution-date>/Web/raw-git-data.txt`

## How To Run

### In Claude Code

```text
Use $tk-impact-analysis to perform QA impact analysis for PLATFORM=Web.
Detect the current branch and compare it with the correct release tag automatically.
Use the current source repository for git comparison and the default regress.txt.
```

### Locally

```bash
python3 .codex/skills/tk-impact-analysis/scripts/tk_impact_analysis.py --platform Web --write-raw
```

Compare a specific release against another branch explicitly:

```bash
python3 .codex/skills/tk-impact-analysis/scripts/tk_impact_analysis.py \
  --platform Web \
  --base-branch release/4.5.0 \
  --release-branch fix/release_4/7/0 \
  --write-raw
```

Useful options:

- `--base-branch feature/some-branch`
- `--release-branch release/4.6.0`
- `--source-repository /path/to/repo`
- `--regress-path /path/to/regress.txt`
- `--report-path /custom/report.md`
- `--tests-collection-path /custom/test-collection.txt`
- `--date 2026-03-18`
- `--write-raw`

If SSH auth is required during fetch:

1. Run the script manually in your terminal and complete the SSH prompt.
2. After telling Claude it is done, Claude must verify the generated files in `reports/<execution-date>/Web/` were updated recently before using them.

## Recommended Cost-Optimized Flow

1. Run the local script first with `--write-raw`.
2. Let Claude refine the generated `raw-git-data.txt`, `report.md`, and `test-collection.txt` instead of redoing repo discovery.

The recommendations are heuristic and should be reviewed by QA before execution.
