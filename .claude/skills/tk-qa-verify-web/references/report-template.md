# Templates (STE)

## Plan

```markdown
# <TICKET> — QA plan

## Verdict

**<Automatable | Automatable with mocks | Partial | Manual only>**, estimate <S|M|L>.
<One sentence: why.>

## Cases

| #   | Type     | Wallet | Case                                 | Read back                 | Needs   |
| --- | -------- | ------ | ------------------------------------ | ------------------------- | ------- |
| C1  | smoke    | A      | Perps tab opens from the home screen | Title "Perps" visible     | nothing |
| C4  | positive | A→B    | Send 0.05 TON from A to B            | B history shows +0.05 TON | tx1     |

## Transactions to sign

WARNING: Approval of this plan lets the agent sign these transactions without a second question.

| Id  | From → To | Chain | Asset | Amount | Why         |
| --- | --------- | ----- | ----- | ------ | ----------- |
| tx1 | A → B     | TON   | TON   | 0.05   | C4 send     |
| tx2 | B → A     | TON   | TON   | 0.05   | returns tx1 |

Expected fees: about <n> TON in total.

## Not covered

-   C9 Ledger signing: hardware. By hand: <steps>.

## Next

**Approve, trim or extend this plan.**
```

## Report

```markdown
# <TICKET> — QA report

## Verdict

**PASS | PASS with gaps | FAIL | BLOCKED**: <one clause why>.

## Environment

| Item    | Value                                             |
| ------- | ------------------------------------------------- |
| PR      | <url>                                             |
| App     | <preview url>                                     |
| Browser | Desktop Chrome (Playwright)                       |
| Wallets | A = multichain, B = legacy TON, C = empty battery |
| Runs    | <n>                                               |
| Spent   | tx1 0.05 TON, tx2 0.05 TON; fees about 0.01 TON   |

## What was checked

| Case               | Route        | Expected      | Interaction       | Read back      | Result   | Video                              |
| ------------------ | ------------ | ------------- | ----------------- | -------------- | -------- | ---------------------------------- |
| C1 Perps tab opens | Home → Perps | title "Perps" | click tab "Perps" | assert heading | **PASS** | out/<T>/run/artifacts/…/video.webm |

## Not covered

-   **C9**: Ledger is hardware. By hand: <steps>.

## Findings in the ticket

-   FAIL: <what is wrong, exact value>. Evidence: <path>.

## Adjacent findings

None.

## Stability

Clean: 0 page errors, 0 crashes in <n> tests.

## Next

**<Owner> <does what>.**
```
