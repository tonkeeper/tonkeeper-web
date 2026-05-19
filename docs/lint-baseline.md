# Lint baseline

`yarn lint` runs with `--max-warnings=493`. Existing violations are demoted to `'warn'` in
`.eslintrc.js` (search for `// baseline:` comments) so CI passes today, and `--max-warnings`
prevents regressions: each PR can only equal or reduce the count.

The goal is to drive each demoted rule to zero violations, then promote it back to `'error'` (and
lower `--max-warnings` accordingly).

## Demoted rules (severity baseline: 493 warnings, 0 errors)

The following rules were demoted from `error` (or `off`) to `warn`:

| Rule                                       | Violations | Notes                                                                                                   |
| ------------------------------------------ | ---------: | ------------------------------------------------------------------------------------------------------- |
| `react-hooks/exhaustive-deps`              |        269 | **Was off** — re-enabled to catch stale closures. High count is expected; treat as a backlog, not noise |
| `no-console`                               |         70 | Already `warn` with `allow: ['debug', 'error', 'info']`                                                 |
| `i18next/no-literal-string`                |         43 | User-facing string literals; cleanup needs translation keys                                             |
| `@typescript-eslint/no-unused-vars`        |         28 | TypeScript-aware; complements `unused-imports/no-unused-vars`                                           |
| `complexity`                               |         25 | Threshold `max: 15` (was default 20). Refactor long functions or `// eslint-disable`                    |
| `@typescript-eslint/no-explicit-any`       |         18 | Highest-priority TS fix — re-tighten first                                                              |
| `eqeqeq`                                   |          9 | Loose equality; mostly `== null` checks                                                                 |
| `@typescript-eslint/no-shadow`             |          8 | Variable shadowing                                                                                      |
| `max-classes-per-file`                     |          7 | Split files or `// eslint-disable-next-line`                                                            |
| `unused-imports/no-unused-vars`            |          7 | Args-too; uses `^_` ignore pattern                                                                      |
| `import/extensions`                        |          4 | Mixed `.json`/`.ts` extension policy                                                                    |
| `prettier/prettier`                        |          3 | Format drift the autofix couldn't reconcile                                                             |
| `@typescript-eslint/naming-convention`     |          2 | Enum members must be `UPPER_CASE`                                                                       |
| `@typescript-eslint/no-unused-expressions` |          2 | Statements with no side effect                                                                          |
| `@typescript-eslint/no-non-null-assertion` |          1 |                                                                                                         |
| `import/no-named-as-default` / `-member`   |          2 |                                                                                                         |

## How to promote a rule back to `error`

1. Fix all violations of the rule (or add precise `// eslint-disable-next-line` for the few
   unavoidable ones).
2. In `.eslintrc.js`, change the rule's severity from `'warn'` back to `'error'` and delete the
   `// baseline:` comment.
3. Reduce `--max-warnings` in the root `package.json` `lint` script by the number of violations
   removed.
4. Run `yarn lint` to confirm exit 0.

## Disabled rules

-   `import/no-unresolved` — disabled until `eslint-import-resolver-typescript` is configured.
    Without it, workspace subpath imports like `@tonkeeper/core/dist/...` and
    `styled-components/dist/types` produce thousands of false positives. To re-enable: install the
    resolver, configure it in `.eslintrc.js`, then flip the rule back on.
