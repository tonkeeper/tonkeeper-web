# Required Data

## Startup Parameters

- `PLATFORM`: `Web`

Optional:

- `SOURCE_REPOSITORY`: override source repository location
- `BASE_BRANCH`: overrides the current checked out branch
- `RELEASE_BRANCH`: overrides the auto-selected release branch
- `REPO_PATH`: legacy alias for `SOURCE_REPOSITORY`
- `REGRESS_PATH`: override regression checklist TXT location
- `REPORT_PATH`: override Markdown report output
- `TESTS_COLLECTION_PATH`: override generated TXT collection output

Default report locations:

- template: `report.md`
- actual run report: `reports/<execution-date>/Web/report.md`
- tests template: `test-collection-template.txt`
- actual run tests collection: `reports/<execution-date>/Web/test-collection.txt`
- raw git bundle: `reports/<execution-date>/Web/raw-git-data.txt`

## Default Platform Mapping

- source repository:
  - auto-detect the nearest parent git repository containing the skill
- `Web`
  - regress file: `sources/Web/regress.txt`

Resolve the default `regress.txt` path relative to the skill directory.

## Current Workspace State

- Present now:
  - source repository auto-detects to this repo (`tonkeeper-web`)
- Missing now:
  - `sources/Web/regress.txt` — must be added by QA before running the skill

If `regress.txt` is missing, the skill must stop and report this clearly.

## Minimum Data Needed For A Useful Analysis

- A valid git repository
- The current branch or an explicit `BASE_BRANCH`
- At least one release tag matching `vX.Y.Z` (e.g. `v4.7.0`), or a release branch matching `release/X.Y.Z` or `release/YY.MM.Iterator`
- `sources/Web/regress.txt`

## Recommended Commands

Run these inside the repo:

```bash
git fetch origin '+refs/heads/release/*:refs/remotes/origin/release/*'
git rev-parse --is-inside-work-tree
git branch --show-current
git branch --list 'release/*'
git branch -r --list 'origin/release/*'
git diff --name-status CURRENT_BRANCH...SELECTED_RELEASE_BRANCH
git diff --stat CURRENT_BRANCH...SELECTED_RELEASE_BRANCH
git log --left-right --cherry-pick --oneline CURRENT_BRANCH...SELECTED_RELEASE_BRANCH
```

Branch selection rules:

- if `CURRENT_BRANCH` is the latest release, compare it with the previous release
- if `CURRENT_BRANCH` is a release but not the latest release, compare it with the latest release
- if `CURRENT_BRANCH` is not a release branch, compare it with the latest release
