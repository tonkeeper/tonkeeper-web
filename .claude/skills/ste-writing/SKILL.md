---
name: ste-writing
description:
    Write agent plans, reports, PR bodies, hand-off summaries and Linear comments in Simplified
    Technical English (ASD-STE100 style) — short, exact, scannable, not boring. Use for every plan
    or report the tk-implement / tk-verify workflows and the tk-qa-verify-web skill produce, and
    whenever the user asks for STE.
---

# STE for plans and reports

Simplified Technical English (ASD-STE100) makes text exact for readers who skim, read in a second
language, or act on it later. Our goal: a reader understands the result in 10 seconds and finds the
evidence in 30.

## Sentence rules

1. **One idea per sentence.** Procedure: max 20 words. Description: max 25 words.
2. **Active voice.** "The reviewer found 2 bugs." Not "2 bugs were found."
3. **Imperative for instructions.** "Top up wallet B." Not "Wallet B should be topped up."
4. **Present or simple past tense.** No "would", "might", "should be able to".
5. **One word, one meaning.** Pick a term and keep it: _wallet A_, _wallet B_, _case_, _finding_,
   _gate_. Never swap to a synonym.
6. **Concrete subjects.** Name the screen, file, button, value. "The Send button stays disabled at
   0.01 TON", not "the issue persists".
7. **No idioms, no filler.** Delete "basically", "it seems", "in order to", "please note", "as
   mentioned".
8. **Numbers with units.** "3 attempts", "0.05 TON", "42 s". Use digits.
9. **Lists for steps.** Number steps. One action per step. Put the condition first: "If the gate
   fails, retry once."
10. **Warnings before the step** they apply to, with the reason: "WARNING: This step signs a
    transaction. It sends 0.05 TON from wallet A to wallet B."

## Words to prefer

| Use                               | Not                                      |
| --------------------------------- | ---------------------------------------- |
| do, make, show, find, stop, start | perform, carry out, facilitate, leverage |
| use                               | utilize, employ                          |
| fail / pass                       | not succeed / succeed                    |
| before / after                    | prior to / subsequent to                 |
| because                           | due to the fact that                     |
| can / cannot                      | is able to / is unable to                |
| about                             | approximately (unless you give a range)  |

## Make it readable, not boring

-   **Verdict first.** Line 1 says the result: `PASS`, `FAIL`, `BLOCKED`, `HANDOFF`, and why in one
    clause.
-   **Tables for comparison**, lists for sequence, prose only for a reason.
-   **Show, do not describe.** Paste the exact error line, the file:line, the value on screen.
-   **Empty section = one word.** "None." Do not delete required sections, do not pad them.
-   **Bold the one thing the reader must act on** per section. Only one.
-   **End with the next action and its owner.** "Next: the ticket owner checks the preview at
    <url>."

## Check before you send

-   Each sentence ≤ 25 words? Passive voice gone?
-   Every claim has evidence (path, line, value, video)?
-   Same term for the same thing everywhere?
-   First line = verdict? Last line = next action?
