---
name: tk-impact-analysis
description: Analyze QA regression impact for Tonkeeper Web by comparing the current branch with the relevant release branch, reviewing sources/Web/regress.txt, and recommending test blocks, missing coverage, extra checks, and a generated TXT test collection.
---

# TK Impact Analysis

Use this skill when the user wants release impact analysis for Tonkeeper Web and needs QA recommendations driven by code changes plus the platform regression checklist.

## Startup Parameters

Require these parameters in the user request or infer them from nearby context:

- `PLATFORM`: always `Web` for this repository

Optional parameters:

- `BASE_BRANCH`: overrides the current checked out branch
- `RELEASE_BRANCH`: overrides the auto-selected release branch
- `SOURCE_REPOSITORY`: overrides the source repository used for git comparison
- `REPO_PATH`: legacy alias for `SOURCE_REPOSITORY`
- `REGRESS_PATH`: overrides the default `regress.txt` path
- `REPORT_PATH`: overrides the default Markdown report path
- `TESTS_COLLECTION_PATH`: overrides the default generated TXT collection path

For default folder mapping and current workspace availability, read [references/required-data.md](references/required-data.md).

For the reusable invocation prompt, read [references/prompt-template.md](references/prompt-template.md).

## Workflow

1. Prefer existing generated artifacts when they are available.
- Before redoing git discovery, check whether the run already has:
  - `reports/<execution-date>/Web/raw-git-data.txt`
  - `reports/<execution-date>/Web/report.md`
  - `reports/<execution-date>/Web/test-collection.txt`
- If those files exist and look current for the requested run, use them as the primary input for the AI refinement pass.
- Only redo repository inspection if the generated files are missing, clearly stale, created more than 1 day ago, or the user asked for a fresh rerun.

2. Resolve the platform-specific paths.
- Use `SOURCE_REPOSITORY` or `REPO_PATH` if the user provided them.
- Otherwise auto-detect the source repository from the nearest parent git repository that contains the skill.
- Use the default `regress.txt` mapping from [references/required-data.md](references/required-data.md).
- If the selected source repository or `regress.txt` is missing, stop the analysis and report exactly what is missing.

3. Validate the git inputs inside the selected repository.
- Confirm the repo exists and is a git worktree.
- In the local-script flow, fetch release refs from `origin` first so the latest release set is available locally.
- If fetch fails with SSH authentication errors, stop and ask the user to run `python3 .codex/skills/tk-impact-analysis/scripts/tk_impact_analysis.py --platform Web --write-raw` manually in their terminal.
- After the user says it is done, verify that `reports/<execution-date>/Web/raw-git-data.txt`, `report.md`, and `test-collection.txt` were updated recently before using them.
- Detect the current branch unless `BASE_BRANCH` was provided explicitly.
- Prefer release tags over release branches for comparison:
  - Discover tags matching `vX.Y.Z` (e.g. `v4.7.0`); skip pre-release tags (`rc`, `alpha`, `beta`).
  - If no tags are found, fall back to branches matching `release/X.Y.Z` or `release/YY.MM.Iterator`.
- Select the correct comparison ref:
  - If `BASE_BRANCH` resolves to the latest release ref, compare it with the previous release ref.
  - If `BASE_BRANCH` resolves to an older release ref, compare it with the latest release ref.
  - If `BASE_BRANCH` is not a release ref, compare it with the latest release ref.
- If `RELEASE_BRANCH` was provided explicitly, use it as the comparison target.
- Confirm both comparison refs exist locally or as remote refs.
- Prefer comparing `CURRENT_BRANCH...RELEASE_BRANCH` so the diff is relative to the merge base.

4. Inspect branch delta with git, paying special attention to dependency and config changes.
- Start with:
  - `git diff --name-status CURRENT_BRANCH...RELEASE_BRANCH`
  - `git diff --stat CURRENT_BRANCH...RELEASE_BRANCH`
  - `git log --left-right --cherry-pick --oneline CURRENT_BRANCH...RELEASE_BRANCH`
- Then inspect important changed files directly.
- **Dependency and config changes require expanded scope — do not skip them:**
  - If any `package.json` changed: read its diff and identify which packages were added, removed, or version-bumped. For each changed package, map it to the functional areas it affects and add those areas to the test scope. Examples:
    - `@tonconnect/sdk` → Browser and connected dApps, Signing and proof flows
    - `@ton/ton`, `tonweb` → Send flow, Receive flow, Signing, Staking, Multisig
    - `react-query`, `@tanstack/*` → all screens that load async data (balance, history, tokens, staking)
    - `electron` → Desktop target: window management, IPC, keychain, deep links
    - `@capacitor/*` → Mobile target: camera, clipboard, biometry, notifications
    - Any UI library (`@radix-ui`, `framer-motion`, etc.) → all affected components
  - If any `tsconfig*.json` changed: read the diff, identify changed compiler options (e.g. `strict`, `target`, `lib`, `moduleResolution`). A strict mode change or target downgrade can introduce runtime regressions across the whole app — recommend a broad smoke of all major flows across all targets.
  - If any `vite.config.*` or `webpack.config.*` changed: read the diff, identify changes to chunk splitting, polyfills, env vars, or aliases. Any of these can silently break a specific platform target or feature.
  - In all cases: do not limit the test scope to "build checks only" — config and dependency changes must map to the user-visible features they affect.
- Cluster changes into QA-relevant areas such as onboarding, wallets, send/receive, swaps, staking, signing, settings, localization, analytics, build config, and feature flags.
- Ignore any repo-relative paths listed in [references/excluded-qa-impact-paths.txt](references/excluded-qa-impact-paths.txt) during QA impact mapping.
- Extract concrete module or feature names from changed paths and use them in the report.
- Search `regress.txt` by those module names first, including obvious localized variants when they exist.
- Highlight files that did not match any known QA area.
- For each unmatched file, read its actual diff (or file content if it is a new addition) and derive the concrete user-visible behavior that changed:
  - Identify what the change does (new event, renamed method, new component, config change, etc.).
  - Write a focused test case that verifies that specific behavior — not a generic "exercise the flow" template.
  - Example: if `aptabase-background.ts` gained a new `background_started` event, the suggested test should be "Open the Extension, trigger a background action, verify `background_started` appears in Aptabase with the expected properties."
  - If the file is infrastructure-only with no user-visible change (e.g. build config, lint config), state that explicitly instead of inventing a test.
- Include the derived test cases in both the Markdown report and the generated TXT test collection.

5. Review the platform regression file as an expert QA.
- Treat `regress.txt` as the current regression source of truth.
- Identify the existing regression blocks already covering the changed areas.
- Call out weak coverage, stale wording, duplicated checks, overly broad blocks, or missing negative cases.
- Do not just keyword-match titles; reason from the changed code paths and user flows.

6. Build the impact recommendation.
- Recommend regression blocks from `regress.txt` that should be executed.
- Add a dedicated section for changed files that did not match a known QA area.
- Show which module names and search terms were used for each unmatched file.
- If the module-aware search still finds no matching regression cases, call out that the functionality is new or uncovered and should be tested explicitly.
- Suggest new blocks that should be added to `regress.txt` because code changes are not covered well enough.
- Avoid grouping existing regression cases when the recommended set is small and specific.
- If there are only a few relevant existing tests, list them as separate rows instead of collapsing them into a broad range.
- Suggest extra checks when the diff implies risk:
  - migrations and storage upgrades
  - permissions and auth
  - offline mode
  - upgrade path
  - localization
  - analytics
  - feature flags
  - cross-browser compatibility
  - responsive layout edge cases
  - platform-specific targets (web, extension, desktop, twa, mobile)

7. Persist the result to Markdown.
- Use `report.md` in the skill directory as the template for the report structure.
- Duplicate the final user-facing analysis into `REPORT_PATH` or the default run report path `reports/<execution-date>/Web/report.md`.
- Create the dated platform folder if it does not exist.
- If the run report already exists, update the existing sections in place instead of regenerating the whole document.
- Keep the Markdown easy to scan: short sections, flat bullets, blank lines between sections, and no giant unbroken paragraphs.

8. Generate a TXT test collection with the recommended tests.
- Use `test-collection-template.txt` in the skill directory as the TXT template.
- Write the actual collection into `TESTS_COLLECTION_PATH` or the default run path `reports/<execution-date>/Web/test-collection.txt`.
- The generated file must follow the same indented plain-text style as `sources/Web/regress.txt`.
- Keep the generated collection focused on the recommended execution scope for this run.
- Group tests into logical blocks with indentation.
- It is acceptable to rewrite the run TXT collection fully on each execution.
- When useful, append short source hints inline such as `[regress: 24]` or `[reason: high risk]`.
- When the regress source contains `[SECTION]` rows, keep every ancestor `[SECTION]` row that contains at least one selected check.
- Preserve the original regress file order in the generated TXT collection.

## Output Contract

Return these sections in this order:

1. `Scope`
- platform
- repo path
- regress path
- current branch
- compared release branch
- generated test collection path
- assumptions and missing inputs

2. `Changed Areas`
- changed modules and user-facing flows
- branch-level summary with risk notes

3. `Changed Files Without Known QA Area`
- list unmatched files or the most important unmatched subset
- explain probable impact
- suggest focused tests

4. `Run These Existing Regression Blocks`
- list concrete blocks or cases from `regress.txt`
- when there are only a few relevant existing cases, list each case on its own row
- explain why each block matters for this diff

5. `Add These Missing Blocks`
- propose new regression blocks or case groups missing from `regress.txt`
- explain what code change created the need

6. `Additional Checks`
- targeted exploratory checks, integrations, edge cases, and non-functional risks

7. `Open Questions`
- anything blocking confidence

Also mirror the same content into the Markdown report file with the same section order.
Also generate a TXT test collection with the recommended tests for this run.
Also include the unmatched-file test suggestions, Missing Blocks, and Additional Checks in the generated TXT collection.

## Report File Rules

- Template path: `tk-impact-analysis/report.md`
- Default run report path: `tk-impact-analysis/reports/<execution-date>/Web/report.md`
- Default raw git bundle path: `tk-impact-analysis/reports/<execution-date>/Web/raw-git-data.txt`
- Use the root `report.md` as the template only.
- Write actual analysis results into the dated run report path.
- Do not delete unrelated notes outside the standard analysis sections.
- If the run report already has the standard headings, replace only the section bodies.
- Make the file readable: `#` and `##` headings, short summary bullets, one idea per bullet, file paths and case ids in backticks.

## TXT Test Collection Rules

- Template path: `tk-impact-analysis/test-collection-template.txt`
- Default run test collection path: `tk-impact-analysis/reports/<execution-date>/Web/test-collection.txt`
- Keep the structure compatible with `sources/Web/regress.txt`:
  - one test or block per line
  - indentation defines nesting
  - no CSV headers or metadata rows
- Include only the recommended test subset for the specific analysis.
- Include:
  - existing regress rows selected for this run
  - suggested tests for unmatched files
  - Missing Blocks
  - Additional Checks
- Prefer this line style:
  - block line: `Send TON`
  - child line: `    Send TON to an address with a comment [regress: 12]`

## Quality Bar

- Be opinionated and risk-based, not exhaustive for its own sake.
- Prefer concrete test intent over generic QA advice.
- Prefer module names and user flows over generic type-based guesses.
- Tie every recommendation back to changed files, changed behavior, or a clear coverage gap.
- If `regress.txt` is missing, say so plainly instead of inventing analysis.
