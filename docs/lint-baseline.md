# Lint baseline

`yarn lint` runs with `--max-warnings=93`. Existing violations are demoted to `'warn'` in
`.eslintrc.js` (search for `// baseline:` comments) so CI passes today, and `--max-warnings`
prevents regressions: each PR can only equal or reduce the count.

The goal is to drive each demoted rule to zero violations, then promote it back to `'error'` (and
lower `--max-warnings` accordingly).

## Demoted rules (severity baseline: 93 warnings, 0 errors)

The following rules were demoted from `error` (or `off`) to `warn`:

| Rule                          | Violations | Notes                                                                                                  |
| ----------------------------- | ---------: | ------------------------------------------------------------------------------------------------------ |
| `react-hooks/exhaustive-deps` |         93 | **Was off** — re-enabled to catch stale closures. High count is expected; treat as a backlog, not noise |


## How to promote a rule back to `error`

1. Fix all violations of the rule (or add precise `// eslint-disable-next-line` for the few
   unavoidable ones).
2. In `.eslintrc.js`, change the rule's severity from `'warn'` back to `'error'` and delete the
   `// baseline:` comment.
3. Reduce `--max-warnings` in the root `package.json` `lint` script by the number of violations
   removed.
4. Run `yarn lint` to confirm exit 0.

## Disabled rules

-   `complexity` — disabled. Most violations were essential complexity in React render
    branches (state-machine dispatch on discriminated unions) where splitting into helpers
    hides cases behind indirection without reducing cognitive load. Original threshold was
    `max: 15` with 25 violations.
-   `import/no-unresolved` — disabled until `eslint-import-resolver-typescript` is configured.
    Without it, workspace subpath imports like `@tonkeeper/core/dist/...` and
    `styled-components/dist/types` produce thousands of false positives. To re-enable: install the
    resolver, configure it in `.eslintrc.js`, then flip the rule back on.
-   `max-classes-per-file` — disabled because the codebase intentionally groups tightly-coupled
    classes in single files (e.g. `Atom`/`Subject`/`ReplaySubject` in `atom.ts`, polyfill class sets
    in `bluetooth-plugin.ts`, `BaseApp` + helpers in `AppSdk.ts`). The "one class per file" rule is
    a stylistic preference that conflicts with this design choice.
-   `@typescript-eslint/no-unused-vars` — disabled in favor of `unused-imports/no-unused-vars`,
    which honors the `^_` ignore pattern. Both rules check the same thing; running both produces
    duplicate violations for any unused variable not prefixed with `_`.
