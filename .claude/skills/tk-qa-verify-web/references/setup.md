# One-time machine setup (web QA)

| #   | What               | How                                                                                                                                                                         |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Playwright browser | `cd tests/playwright && npx playwright install chromium`                                                                                                                    |
| 2   | Secrets            | `cp tests/playwright/.env.example tests/playwright/.env`, fill in the `QA_*` block yourself. Agents cannot read or write this file.                                         |
| 3   | Wallet A           | BIP39 phrase that is not a valid TON phrase → imports as multichain. Fund: TON + the chains the team tests (small amounts).                                                 |
| 4   | Wallet B           | 24-word TON phrase → imports as legacy TON. Fund: TON.                                                                                                                      |
| 5   | Saved profiles     | `cd tests/playwright && yarn qa:setup --headed` once. Watch it. It saves `qa/.auth/A.json` and `B.json` (gitignored, encrypted wallet data). Delete a file to import again. |
| 6   | Linear MCP         | connected in Claude Code (`/mcp`). Read-only for this skill until the user says "post".                                                                                     |
| 7   | GitHub CLI         | `gh auth login`.                                                                                                                                                            |
| 8   | Agent worktree     | created by the workflows at `<repo>/../tonkeeper-web-agent`. Needs `NODE_AUTH_TOKEN` for `yarn install` (GitHub packages).                                                  |
| 9   | Monthly top-up     | one person owns it. Keep only the month's budget on A and B. Set `QA_MONTHLY_CAPS` to match.                                                                                |

## Where things are

| What                              | Where                                                 | In git?          |
| --------------------------------- | ----------------------------------------------------- | ---------------- |
| Cases                             | `tests/playwright/qa/cases/<T>.json`                  | yes, with the PR |
| Specs                             | `tests/playwright/qa/specs/<t>.spec.ts`               | yes, with the PR |
| Fixtures, setup, config           | `tests/playwright/qa/*.ts`, `playwright.qa.config.ts` | yes              |
| Secrets                           | `tests/playwright/.env`                               | no               |
| Saved wallets                     | main checkout `tests/playwright/qa/.auth/`            | no               |
| Plans, reports, videos, spend log | main checkout `tests/playwright/qa/out/`              | no               |

The QA config never runs in CI on every PR. Money cases run only from an approved plan.
