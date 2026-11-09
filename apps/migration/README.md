# Migration app

The app served on the origin the wallet is migrating **away from**. It is a separate build from
`apps/web` on purpose: this origin keeps answering for a long tail after the move, and nothing about
it should require shipping the wallet bundle. It carries no `uikit` dependency, so wallet UI cannot
appear here by accident.

Every visit resolves to exactly one outcome — see `src/routing.ts`, which is the spec's condition
table verbatim:

| Condition                        | Outcome                                                |
| -------------------------------- | ------------------------------------------------------ |
| `#check`                         | Straight back to `/migrate#found` or `/migrate#none`   |
| `/handoff`, opened by a window   | The popup: consent, then the encrypted handoff         |
| `/ton-connect`, `/wc`, `/signer` | Forwarded to the new origin, query and fragment intact |
| `/recover`, with a secret here   | The phrases, read back to their owner                  |
| Handoff already done             | Plain redirect, no payload                             |
| Wallet data present              | "We've moved"; its button opens `/migrate#move`        |
| Empty storage                    | Redirect                                               |

Launched from an iOS Home Screen icon (`navigator.standalone`), the two redirects show a screen
saying how to re-add the icon from the new origin instead, since the icon stays pinned here and
would otherwise bounce on every launch. "We've moved" adds the same hint under its text.

## The other side of the round trip

The check is started by the **wallet**, not by this app. `apps/web/src/migration/arrival.ts` holds
the mirror of the table above — the conditions under which a visit to the new origin goes looking
for wallets here at all:

| Condition                         | Outcome                                                        |
| --------------------------------- | -------------------------------------------------------------- |
| Wallets already on the new origin | Boots as usual — no migration code runs                        |
| Crawler user-agent                | Boots as usual — indexing never sees a redirect                |
| This origin already asked         | Onboarding, with the way back in under the two buttons         |
| Otherwise                         | Ping here; reachable → bounce with `#check`, down → onboarding |

The flag behind "already asked" is written as the check leaves, not when an answer arrives, so a
round trip that ends without importing can't turn into an endless bounce between two domains. It is
not a lock: the "I had a wallet on …" link under the start screen's buttons leads to `/migrate`,
which offers the move whatever the flag says, so every failure stays retryable. An unreachable
origin leaves it unset, so that one is retried on its own.

The check itself is one bit, plus the language picked here riding along with `#found` (see Language
below). The move happens in a popup: `/migrate`'s button opens `/handoff` here, and the two windows
talk over `postMessage` (`src/channel.ts` ↔ `apps/web/src/migration/handoffChannel.ts`). A popup and
not a same-tab bounce, because a message is the one channel where the browser, not the sender, says
who sent it.

**This origin must never send `Cross-Origin-Opener-Policy`, and the new origin only
`same-origin-allow-popups`.** Anything stricter cuts the popup off from its opener, and the handoff
stops working without an error on either side. `scripts/check-deployed-headers.mjs` checks both
after every deploy.

To re-run the check on a profile that already asked, clear the flag on the **new** origin:

```js
localStorage.removeItem('tonkeeper_migration_old_origin_checked');
```

## Two origins

The handoff only means anything across two origins, because the wallet data it moves is
origin-scoped `localStorage`. Both sides come from build-time env vars — never source literals, and
never anything the running page can influence:

| Var                    | Read by                         |
| ---------------------- | ------------------------------- |
| `MIGRATION_NEW_ORIGIN` | both builds — the destination   |
| `MIGRATION_OLD_ORIGIN` | `apps/web`, and this dev server |

### Locally

An origin is scheme + host + port, so two ports on `localhost` are already two origins with separate
storage. Put this in the repo-root `.env`:

```sh
MIGRATION_OLD_ORIGIN=http://localhost:5174
MIGRATION_NEW_ORIGIN=http://localhost:5173
```

Then run both: `yarn dev:web` (5173, the wallet) and `yarn dev:migration` (5174, this app).

Note that "same site" ignores the port, so the two local origins are same-site — fine for walking
the screens, not a substitute for the cross-site check below.

### As a demo

No new domain needed, but it does want its **own Pages project**. `pages.dev` is a Public Suffix
List entry, so the registrable domain is `<project>.pages.dev`: two projects are genuinely
cross-site the way `tonkeeper.com` and `keeperwallet.com` are, while two branches of one project
share a site and are only cross-origin. The handoff itself is origin-based and works either way, but
the site boundary is what browser bounce-tracking mitigations, `SameSite=Strict` cookies and
`Sec-Fetch-Site` key off — so a same-site demo can pass while production fails.

1. Create a `tonkeeper-web-migration` Pages project (the `pages_project` input's default).
2. Run **Migration App Deploy** with `environment: dev` and
   `migration_new_origin: https://<wallet branch>.tonkeeper-web.pages.dev`.
3. Run **Tonkeeper Web Deploy** with
   `migration_old_origin: https://dev.tonkeeper-web-migration.pages.dev` and the matching
   `migration_new_origin`.

Pointing `pages_project` at `tonkeeper-web` puts both apps in one project's branch namespace. That
works for eyeballing screens, but it is same-site, so don't sign the flow off on it.

### Staging

Staging is a pair: the wallet on `https://staging.tonkeeper-web.pages.dev`, redeployed on every push
to `main`, and this app on `https://staging.tonkeeper-web-migration.pages.dev`, redeployed by
**Migration App Deploy** only when a push to `main` changes what this bundle is built from.
Repository variables `STAGING_MIGRATION_OLD_ORIGIN` and `STAGING_MIGRATION_NEW_ORIGIN` point them at
each other. After changing them, re-run **Staging Deploy**, and **Migration App Deploy** with
`environment: staging` if the new origin changed. Unset, staging uses the production origins. RC and
release builds don't read them. Seed a wallet on the staging old origin (below) before walking the
flow.

## What counts as "there is a wallet here"

`src/storage.ts` reads the wallet's own `localStorage`, still sitting on this origin after the move.
Every account type counts — watch-only and a paired Ledger are as much a reason to offer the handoff
as a mnemonic is — and so does the pre-`accounts` storage layout, whose per-wallet records are keyed
by public key. Preferences are not wallet data: theme, language and friends are written by merely
opening the site, so a visitor who never made a wallet still redirects.

A narrower question decides whether "We've moved" offers the manual way out as well, and
`src/accounts.ts` answers it: whether any account here keeps a password vault this origin can open.
A profile of watch-only and hardware accounts has nothing to read back — re-adding the address or
re-pairing the device on the new origin is the whole of it — and neither does one whose secrets live
in a native keychain rather than in this browser, so the link stays hidden for both. The gate and
the list are the same function, so the screen can never open on nothing.

The key names are restated there rather than imported, because this app builds without
`@tonkeeper/core` so that no wallet code can reach the bundle served here. `src/crypto.ts` restates
the read half of `cryptoService` for the same reason, and `src/address.ts` the raw-to-friendly
address conversion.

The probe, the condition table, the account list and the vaults themselves are all plain functions
over plain data, so what counts as a wallet, what can be handed back and what signing out removes
are pinned by `src/*.test.ts` rather than by opening a browser
(`yarn workspace @tonkeeper/migration test`, and in CI with the rest of `yarn test`).

## Seeding a wallet on the old origin

`localStorage` belongs to an origin, so the only way in is to run JS there.
`packages/core/scripts/seedLegacyStorage.mjs` prints a paste-ready snippet:

```sh
yarn workspace @tonkeeper/core seed:legacy --password 123456 | pbcopy
```

The throwaway mnemonic, password and derived addresses go to stderr; the snippet goes to stdout.
Paste it into the devtools console **on the old origin** — local or deployed — and the page reloads
seeded. `--json` emits the storage map instead, for a browser context seeded before first paint.

Never pass it a phrase holding real funds.

## Copying a real profile

`scripts/exportOriginStorage.js` in `@tonkeeper/core` copies one origin's wallet storage to another,
for walking the flow against a profile the app actually produced rather than a seeded one:

```sh
yarn workspace @tonkeeper/core export:storage | pbcopy
```

Paste that into the devtools console on the origin you are copying **from**. It prints what it found
and puts a restore snippet on the clipboard; paste that one into the console on the local old
origin. The encrypted vaults travel with it, so copy a profile you're willing to have in a clipboard
— for anything else, `seed:legacy` above makes a throwaway.

## Recovering by hand

`/recover` is the one thing only this origin can do, and the fallback if the automatic handoff is
ever switched off: the secrets are here, so it reads them back. It borrows its shape from the
Telegram mini app's sunset flow (`apps/twa/src/stub/`) — the accounts it can open, then a password,
then the phrase, with sign-out underneath it.

Every step is local. The vault is decrypted in the browser with the password typed into it, so the
flow works with no connection and a wrong password simply fails the AES-GCM tag; nothing about the
screen reaches a server. Both vault formats are read — today's PBKDF2 one and the SHA-256 one that
predates it — because both are still out there, as are both storage layouts the accounts themselves
live in.

Two behaviours are worth keeping:

-   **The flow drops back to the list whenever the page is hidden.** A revealed phrase must not be
    left on screen for whoever returns to the tab, nor end up in an app-switcher snapshot — which is
    why the reset happens on `hidden` rather than on the way back.
-   **Signing out is the only wallet data this app writes, and it only ever takes away.** It removes
    the account and with it the last copy of its secret, which is why it sits behind the phrase and
    a checkbox: there is nowhere to ask for the words again afterwards.

## Language

Every screen speaks the language picked in the wallet's settings on this origin — `readLanguage` in
`src/storage.ts` reads it from the same storage (`language`, or the active wallet's record in the
older layout) and falls back to English, as the wallet does. The strings live in
`packages/locales/src/migration`, a namespace of its own: the wallet's locale build never flattens
it in, and this bundle carries only English plus the one locale it fetches. `yarn lint:i18n` doesn't
read it — `src/i18n.test.ts` pins that every locale has every key with the same placeholders.

The new origin has no wallet, and so no language setting, until the import, so the answer to its
check carries this one: `/migrate#found&lang=N`, where `N` is the `Language` enum value (and so does
"Move my wallets", as `#move&lang=N` — the same offer, under its own fragment so the new origin's
analytics can tell the click from the check's answer). It only changes what `/migrate` is shown in —
nothing is stored from it, and a value that isn't a `Language` is ignored (`resolveMigrateLanding`
in `apps/web/src/migration/arrival.ts`). `#none` shows no screen and carries nothing. After the
import, the wallet's own copy of the setting takes over.

To walk the screens in another language, set it on this origin (the value is the `Language` enum in
`packages/core/src/entries/language.ts`):

```js
localStorage.setItem('tonkeeper_language', JSON.stringify({ payload: 1 })); // ru
```

## Walking the screens

The screens follow this origin's storage, so seed or clear it to pick one:

```
/                                  redirect (empty storage)
/                                  "We've moved" (any account present)
/#check                            straight back to the new origin's /migrate#found or #none
/handoff                           the popup; only when opened from the new origin's /migrate
/ton-connect?v=2&id=x              forwarded, query intact
/recover                           the phrases, for a profile holding a secret
/#tgAuthResult=…                   Telegram login result, handed to the mobile bridge or the opener
/?tg-auth=forward#tgAuthResult=…   the new origin's login popup (no opener), sent on to the same URL there
/img/…                             token and Battery images other builds still load from here
```

`/recover` asks for the password the profile was seeded or set up with — `seed:legacy` prints the
one it used.

For the already-migrated redirect, set the flag the handoff will write:

```js
localStorage.setItem('tonkeeper_migrated_at', JSON.stringify({ payload: Date.now() }));
```

On the wallet side, `/migrate#none` carries straight on to where the visit was going — the boot
check is invisible, so its "nothing here" answer is too — and `/migrate` is the move offer. "No
wallets found" only appears when the person asked by hand and the popup found nothing. The
confirmation screen needs a real popup: seed this origin, open `/migrate` on the new one and press
"Move wallets".

## The handoff

`src/handoff.ts` builds the payload and `src/channel.ts` answers the opener;
`apps/web/src/migration/handoffChannel.ts` opens the popup, `handoffOpen.ts` opens the payload and
`handoffImport.ts` writes it. Every property below is pinned by a test on one side or the other, and
the wallet's tests seal with this app's real code.

-   **The browser vouches for the sender.** Each side acts on a message only when `event.source` is
    the other window of this exchange and `event.origin` its pinned origin, and posts only with that
    origin as `targetOrigin`. A page anywhere else can neither answer the request nor read the
    answer.
-   **Nothing travels in a URL.** No key, nonce or payload is ever in an address bar, history or
    profile sync; `/migrate`'s fragment only picks a screen and its language.
-   **Sealed to one tab.** ECDH P-256 against a key made for this popup, HKDF-SHA256 salted with its
    nonce and bound to both pinned origins, AES-256-GCM with the header as associated data. The
    private key is non-extractable and lives only in the page's memory; a popup is spent on its
    first payload, and a request expires after 15 minutes.
-   **Allowlisted twice.** Both sides carry the same key list and each applies it on its own. Left
    behind: `meta_encryption_map` (retired, and removed from this origin on every visit), `touch_id`
    (a WebAuthn credential bound to this origin), backend and device credentials (re-issued to the
    new origin), caches and analytics identity.
-   **The password is asked here.** A profile holding any password vault is asked for the password
    after consent, and nothing is sealed until it opens every vault — the same gate the wallet and
    its lock screen put in front of the secrets. It is checked in this page and never sent. A
    profile of watch-only, hardware or keychain accounts has no password to ask for.
-   **No v1 vault travels.** One is re-encrypted to PBKDF2 in the snapshot at that same prompt —
    this origin's own storage is not touched — and the receiving side rejects any that arrives
    anyway.
-   **Nothing overwritten.** Incoming accounts whose id is already on the new origin are skipped, as
    is every other key it already holds. When both sides have password wallets, one password has to
    open a vault on each before anything is added.
-   **Approved on both sides.** Consent here names the destination and lists every wallet that
    leaves, read from the same snapshot the payload is sealed from. The new origin lists the
    verified payload in the same shape before writing anything, and once that is confirmed (plus the
    shared password, for a merge into password wallets already there) it imports and opens the
    wallet straight away — there is no result screen.
-   **Nothing leaves `/migrate`.** The resume path is resolved against the new origin and dropped if
    it isn't on it, and neither app is ever framed (`public/_headers`).
-   **Bounded.** The receiving side caps what a payload may be and what it may inflate to.
