# Telegram gift trading review

This Draft PR accompanies a local experiment for trading tokenized Telegram gifts in a wallet. The proposed flow covers buying a fixed-price listing, creating and cancelling a listing, and making, accepting and cancelling offers. The experiment uses one shared local market for the two wallet brands. The laboratory is disabled in default builds and has no production signing or broadcast path. The Getgems adapter displays advertised offers. Getgems execution remains disabled.

## Tonkeeper Web

The foundation and Web overlay exercise the same gift reference, review, pending journal and settlement rules as MyTonWallet. The component can display fixed-price listings and offers from the synthetic shared market. The 13 component regression checks and its TypeScript check passed. The full Web app and its packaged variants still require the project's ChainKit dependency and separate application verification.

Verified against base `d57398ec7a6b4d76455bb71ed1e19d4a3a8c4774`.

The target branch tip was `f9073ffff40b10da479e4d72b3f32f25c37c62af` during draft preparation. The checks below apply to the archived patch stack on `d57398ec7a6b4d76455bb71ed1e19d4a3a8c4774`. They do not cover a GitHub test merge with the newer target tip.

## Shared verification

The synthetic TON emulator exercises custody, settlement and refund. In the browser fixtures, both tabs converged on the same settled purchase after a committed continuation response was lost. Closing both tabs before receiving that response and restarting the emulator preserved the same operation. Reconciliation made no second submission. Seller and royalty credits were checked independently in the laboratory. A partially observed payout remained pending until both credits were available. Malformed or ambiguous provider responses, expired or superseded reviews and an unavailable strict browser journal were rejected. All 106 shared tests on the current shared code and eight emulator application tests on the last application revision passed.

The review archive contains the exact bases, patch order, SHA-256 checksums, test commands, decision packet and version-specific results. The executable test harness and build dependencies are in the original laboratory workspace. The archive SHA-256 is `a3c364aa45ee913ac2f9371834548878ad70fe33e63270576c2eee637817f707`.

## Decisions before enabling trading

- Own market. Decide who funds and owns the reserve, who pays storage, maintenance and terminal settlement fees, how unused balances are handled and what happens when funds run out. Finalize the recipient-credit and recovery proof model, supported NFT and collection profiles, and source of authenticated chain history and finality.
- Getgems. Verify supported contract versions, atomic enforcement of the reviewed purchase price, offer funding and collection-offer execution before enabling each action.
- Clients. Integrate the native flows, run full builds and demonstrate the changed workflows in the installed clients. An isolated test environment can use synthetic assets.
- Release. Obtain independent financial security review of the final integrated protocol. The laboratory checks do not establish production settlement or readiness to enable trading.

See [the recorded results](gift-trading-verification.json) for exact patch digests and runtime scope.
