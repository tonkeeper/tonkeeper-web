# Lint baseline

`yarn lint` runs with `--max-warnings=205`. Existing violations are demoted to `'warn'` in
`.eslintrc.js` (search for `// baseline:` comments) so CI passes today, and `--max-warnings`
prevents regressions: each PR can only equal or reduce the count.

The goal is to drive each demoted rule to zero violations, then promote it back to `'error'`
(and lower `--max-warnings` accordingly).

## Demoted rules (severity baseline: 205 warnings, 0 errors)

The following rules were demoted from `error` to `warn`. Counts are violations in src/** code
(excluding `no-console` and `i18next/no-literal-string`, which were already `warn` upstream and
contribute the bulk of the remaining warning count):

| Rule | Violations | Notes |
|---|---:|---|
| `@typescript-eslint/no-unused-vars` | 28 | TypeScript-aware; complements `unused-imports/no-unused-vars` |
| `@typescript-eslint/no-explicit-any` | 13 | Highest-priority fix — re-tighten first |
| `eqeqeq` | 9 | Loose equality; mostly `== null` checks |
| `@typescript-eslint/no-shadow` | 8 | Variable shadowing |
| `max-classes-per-file` | 7 | Split files or `// eslint-disable-next-line` |
| `unused-imports/no-unused-vars` | 7 | Args-too; uses `^_` ignore pattern |
| `complexity` | 5 | Default threshold (20); consider tightening to 10–15 after cleanup |
| `import/extensions` | 4 | Mixed `.json`/`.ts` extension policy |
| `prettier/prettier` | 3 | Format drift the autofix couldn't reconcile |
| `@typescript-eslint/naming-convention` | 2 | Enum members must be `UPPER_CASE` |
| `@typescript-eslint/no-unused-expressions` | 2 | Statements with no side effect |
| `prefer-const` | 2 | `let` that's never reassigned (autofix didn't catch) |
| `@typescript-eslint/no-redeclare` | 1 | `apps/extension/src/entries/proxy.ts` |
| `@typescript-eslint/ban-types` | 1 | `Function` used as a type |

## Always-warn (unchanged, but counted by `--max-warnings`)

| Rule | Violations | Notes |
|---|---:|---|
| `no-console` | 70 | Already `warn` with `allow: ['debug', 'error', 'info']` |
| `i18next/no-literal-string` | 43 | User-facing string literals; cleanup needs translation keys |
| `@typescript-eslint/no-explicit-any` | (5) | Already-warn instances on top of the 13 demoted errors |
| `@typescript-eslint/no-non-null-assertion` | 1 | |
| `import/no-named-as-default` / `-member` | 2 | |

## How to promote a rule back to `error`

1. Fix all violations of the rule (or add precise `// eslint-disable-next-line` for the few unavoidable ones).
2. In `.eslintrc.js`, change the rule's severity from `'warn'` back to `'error'` and delete the `// baseline:` comment.
3. Reduce `--max-warnings` in the root `package.json` `lint` script by the number of violations removed.
4. Run `yarn lint` to confirm exit 0.

## Disabled rules

- `import/no-unresolved` — disabled until `eslint-import-resolver-typescript` is configured.
  Without it, workspace subpath imports like `@tonkeeper/core/dist/...` and
  `styled-components/dist/types` produce thousands of false positives. To re-enable:
  install the resolver, configure it in `.eslintrc.js`, then flip the rule back on.
