# Lessons

One line per lesson: what went wrong → how to catch it next time. Add a line for every bug a human
finds after an agent PASS.

## Playwright mechanics

-   A hand-made `browser.newContext()` gets neither the config's `baseURL` nor video. The `walletA`
    / `walletB` fixtures set both. Use them; do not create contexts in specs.
-   The web app keeps all state in `localStorage` (`tonkeeper_<AppKey>`). Each PR preview is its own
    origin, so a plain `storageState` does not apply there; the fixtures copy the saved wallet into
    the origin under test. A reload keeps the wallet. Import once, on any URL.
-   `qa/wallets.setup.ts` follows the redesigned onboarding (Import Existing Wallet → Existing
    wallet → phrase → password → name → token setup for legacy). If setup fails, fix its selectors
    first. Its errors are sanitized on purpose: debug with `yarn qa:setup --headed` and watch. Do
    not open its `error-context.md`; the page snapshot can hold the phrase.
-   Results: read `node qa/summary.mjs <T>`, not `results.json`. The summary is about 10× smaller.
-   `locator.isVisible({ timeout })` does not wait: the timeout is ignored and it returns at once.
    For an optional screen or modal use `appears(locator)` from the fixtures.
-   A BIP39 phrase derives keys for every chain after Continue, behind a loading button. Wait for
    the phrase screen to go away; do not click Continue again while it loads.
-   A fresh profile has no Battery token. The first TON send/swap confirm screen asks for the
    password (TonProof login) before Confirm is pressed. Answer it, then wait for Confirm to be
    enabled. After Confirm, the password prompt may or may not come again.
-   A legacy-only profile shows the one-time "Multichain wallets are here" promo over its home.
    Close it with "Later" before the first step on wallet B.
-   The legacy confirm screen pads amounts ("0.10 USD₮"). Match amounts with a regex that allows
    trailing zeros, not as an exact substring.
-   The send asset picker searches only symbol and name: type `USD₮`, not `USDT`, until TK-5879
    lands.
-   A rerun of a money spec must not sign again. `signPlanned` refuses an id already in
    `out/spend.log` for the same ticket, and `tx()` in a spec skips it.

## Product

-   `keeper.tonapi.io` SSE returns `Access-Control-Allow-Origin` twice. Legacy live updates fail in
    the browser; the console error is known, not a finding of the ticket under test.
