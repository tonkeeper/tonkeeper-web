# Domain migration — what's left

Tracked in TK-3958. The encrypted handoff (popup + `postMessage`, sealed payload, receiving-side
allowlist, merge-without-overwrite) is done; this is everything else.

## Security hardening (spec A5)

8. **Infra (ops).** DNSSEC, registrar lock, CAA for both domains.

## Analytics (TK-5638)

13. **Migration analytics.** The new origin sends the funnel to the shared Aptabase, the old origin
    sends nothing. There is no Workers Analytics Engine, so the `/_e` idea is dropped.
    -   **New origin:** `migration/analytics.ts` builds its own tracker from the boot config, since
        the app's only exists once a wallet does. Events (`domain-migration.yaml` in
        analytics-schemas): `domain_migration_check`, `_check_answer`, `_offer_view`,
        `_offer_click`, `_popup_result`, `_confirm_view`, `_confirm_click`, `_not_mine_click`,
        `_import_result`. No URL in any of them (spec A5 #7).
    -   **Identity:** `user_id` travels in the handoff. An origin with no wallets adopts it after
        the import event is sent, so a moved user keeps their history; the event carries the old id
        as `legacy_user_id` to join what was sent before the import.
    -   **Old origin:** stays `connect-src 'none'`. Measured from Cloudflare zone HTTP analytics by
        path (`/`, `/handoff`, `/recover`, `/ton-connect`, `/wc`, `/signer`); the `tonkeeper.com`
        zone sits in a different Cloudflare account than the Pages projects. That also answers when
        deeplink forwarding and the old origin can be retired. It can't see fragments or outcomes.
    -   **Open:** the old origin sends `no-referrer`, so new-origin HTTP logs can't tell its traffic
        apart; a query marker on the hop would. Password-prompt outcomes are not tracked.

## Verification

12. **Real two-origin run.** Two separate Pages projects (genuinely cross-site), desktop browsers
    plus mobile Safari/Chrome, where the popup opens as a tab. Nothing has run end to end in a
    browser yet. Include an iOS Home Screen icon on the old origin: its storage is separate from
    Safari's, so check which wallets the handoff popup actually sees from there.

Suggested order: 12, then the rest.
