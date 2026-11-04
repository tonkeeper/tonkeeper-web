---
name: tk-qa-verify-web
description:
    Verify a Tonkeeper web Linear ticket (TK-XXXX) end-to-end with Playwright on the PR preview —
    feasibility, a smoke/positive/negative/edge plan for human approval, specs with video on two
    funded test wallets (A multichain, B legacy TON), real transactions only from the approved plan,
    and an STE report. Used by the tk-verify workflow and directly for "verify TK-XXXX", "can an
    agent test this", "QA this PR". Web (Desktop Chrome) only for now; extension, desktop and iPad
    cases go to "not covered".
---

# TK QA Verify — web

Ported from `mobile_private/.agents/skills/tk-qa-verify`. Same phases, Playwright instead of
Maestro, the PR's Cloudflare preview instead of a simulator.

Read [references/setup.md](references/setup.md) once per machine. Read
[references/lessons.md](references/lessons.md) before you write a spec. Write every plan and report
in STE ([../ste-writing/SKILL.md](../ste-writing/SKILL.md)).

## Non-negotiables

1. **Exercised, not read.** A case counts only when the UI was driven and the new state was read
   back (UI assert, `page.evaluate` on storage, a captured request). The diff tells you what to
   test, never that it works. No interaction → NOT COVERED.
2. **Cover the risk, not the diff.** Happy path, negative (empty, error, cancel, insufficient
   funds), persistence (`page.reload()` and check again), adjacent screens from
   [references/feasibility.md](references/feasibility.md).
3. **Both wallets.** A = multichain, B = legacy TON. If the ticket does not name one, test both. If
   it names one, add a smoke case that proves the other is not broken. For lists, order or defaults,
   add a fresh empty wallet case. Wallet C (optional, `walletC`) exists only for empty-battery
   cases: its battery stays empty forever, and `signPlanned()` refuses any `battery-charge` from or
   to C. If C is not configured, its cases skip and go to "Not covered".
4. **Visual is human.** Do not judge colour, spacing, animation or "looks like Figma". Record it,
   attach the screenshot, mark it `human-visual`. The human checks visuals before this skill runs
   (PR label `visual-ok`).
5. **Seeds never reach you.** Do not read `tests/playwright/.env` or `qa/.auth/`, do not print env.
   A hook blocks it. Wallets come only from the `walletA` / `walletB` fixtures. Never type a seed in
   a spec. Never record or screenshot a recovery phrase screen.
6. **Money only from the approved plan.** See "Money". Quote and confirm screens are free; the
   signing tap is not.
7. **Every page error and crash is a finding.** The fixtures attach `errors-wallet-*`. Report them
   under Stability, separate from the ticket verdict.
8. **No app code edits.** If the app is wrong, the test stays red and the report says so.
9. **Stuck 6 minutes → say so.** Post what is stuck, what you tried, 2–3 options. Move on to other
   cases meanwhile.

## Case format

`tests/playwright/qa/cases/<TICKET>.json`, committed with the PR. Written from the spec only.

```json
{
    "ticket": "TK-1234",
    "cases": [
        {
            "id": "C1",
            "type": "smoke | positive | negative | edge | adjacent",
            "title": "Send screen shows the fee for USDT on TRON",
            "wallet": "A | B | both | C (empty battery) | new",
            "precondition": "Wallet A holds USDT on TRON",
            "steps": ["Open Send", "Pick USDT (TRON)", "Enter 1"],
            "expected": "Fee row shows a value in TRX before Confirm",
            "verify": "assert | human-visual | manual",
            "money": null
        }
    ]
}
```

`money` is `null` or
`{ "kind": "transfer|swap|deposit|withdraw|battery-charge|other", "chain": "ton", "asset": "TON", "amount": "0.05", "from": "A", "to": "B|A|self|<address>" }`.

## Plan file

`<QA home>/out/<TICKET>/plan.json`, local, gitignored. `QA home` is `tests/playwright/qa` of the
**main** checkout (shared by all worktrees).

```json
{
    "ticket": "TK-1234",
    "verdict": "Automatable | Automatable with mocks | Partial | Manual only",
    "estimate": "S | M | L",
    "cases": [{ "id": "C1", "class": "ui", "how": "assert Fee row text", "needs": "nothing" }],
    "transactions": [
        {
            "id": "tx1",
            "kind": "transfer",
            "chain": "ton",
            "asset": "TON",
            "amount": "0.05",
            "from": "A",
            "to": "B"
        },
        {
            "id": "tx2",
            "kind": "transfer",
            "chain": "ton",
            "asset": "TON",
            "amount": "0.05",
            "from": "B",
            "to": "A"
        }
    ]
}
```

`approvedAt` is set only after a human approves the plan in chat. Never set it yourself on your own
initiative. Approval of a plan authorizes exactly its listed transactions, nothing else.

## Money

-   **Round trips first.** A→B then B→A, swap X→Y then Y→X, deposit then withdraw. Only fees leave
    the QA wallets. Non-TON chains: send to self (wallet B is TON-only).
-   **Smallest amount** that proves the criterion. Check provider minimums before planning (swaps,
    bridges, perps). If a minimum is above the cap, the case goes to "not covered" with the number.
-   **Cheap chains only** unless the ticket is about the chain. BTC and Ethereum L1 need a line in
    the plan with the expected fee.
-   **In the spec:** call `await requireFunds()` at the start of a money test (it checks A and B;
    pass `['C']` only when a C case needs TON). Do every signing tap inside
    `signPlanned(plan, 'tx1', async () => { … })`. It refuses an unapproved plan, an unlisted id,
    and outflow over `QA_MONTHLY_CAPS`, and it appends to `out/spend.log`.
-   Report every signed transaction under "Spent" with the id, asset and amount.

## Phases

### A — Feasibility

1. Ticket: Linear MCP, read-only — description, acceptance criteria, labels, comments.
2. PR: `gh pr view`, `gh pr diff`. Confirm that the preview URL belongs to the PR's head commit.
3. Classify every case with [references/feasibility.md](references/feasibility.md). Verdict +
   estimate.

### B — Plan (stop for approval)

Order: smoke → positive → negative → edge → adjacent (from the changed files). Each case:
precondition, steps, expected, **how it is read back**, **what it needs** (mock, funds, a fresh
wallet). List the transactions with amounts. Write `plan.json` and `plan.md`
([references/report-template.md](references/report-template.md) § Plan). Stop. A human approves,
trims or extends.

### C — Execute

1. Specs live in `tests/playwright/qa/specs/<ticket>.spec.ts`. Import `test`, `expect`, `loadPlan`,
   `signPlanned`, `requireFunds` from `../fixtures`. Use `walletA` / `walletB` pages. Test titles
   start with `<TICKET> <case id>`.
2. Selectors: role + accessible name, `data-testid`, ids. Never coordinates. If a control has no
   stable selector, use text and propose a `data-testid` follow-up in the report.
3. Mocks for backend states: `page.route()` inside the spec. Record a real response first, then edit
   it. Say which cases are mocked.
4. Run: from `tests/playwright`, `QA_TICKET=<T> QA_BASE_URL=<preview> yarn qa --grep <T>`, then
   `node qa/summary.mjs <T>`. Read the summary, not the raw JSON.
5. A failure is a spec problem (fix the spec, run again) or an app problem (keep it red, record a
   finding). Max 3 runs in total. Never retry until green.
6. Keep a ledger: case → route → interaction → read back → result → video path.

### D — Report

Template: [references/report-template.md](references/report-template.md) § Report. Sections in
order, none optional: Verdict, Environment, What was checked, Not covered, Findings in the ticket,
Adjacent findings, Stability, Spent, Next. Save it to `<QA home>/out/<TICKET>/REPORT.md`.

### E — Linear (ask first)

Show the user the findings and the comment text. Post with `save_comment` only after a clear yes.
Page crashes and errors outside the ticket's code go to a separate issue, if the user names one.

## Lessons

Every bug a human finds after a PASS becomes two things: a case in the ticket's cases file and a
line in [references/lessons.md](references/lessons.md) that says what the agent missed and how to
catch it next time.
