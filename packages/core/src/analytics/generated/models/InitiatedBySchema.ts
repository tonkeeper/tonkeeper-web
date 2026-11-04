/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Who initiated the transaction the wallet is submitting — the split between
 * self-initiated activity and activity a dapp asked for:
 *
 * - user: the user started the flow inside the wallet UI (send screen, swap, staking,
 * domain renew, …) with no external caller
 * - deep_link: the flow was opened by a tonkeeper:// / https:// deep link
 * - qr_code: the user scanned a QR code
 * - tonconnect_local: requested by a dapp over TON Connect on the same device
 * - tonconnect_remote: requested by a dapp over TON Connect from another device or browser
 * - walletconnect: requested by a dapp over WalletConnect (non-TON chains)
 * - evm_injected: requested by a dapp through an EVM provider the wallet injects into the
 * page (a browser extension's `window.ethereum`, or the one the mobile apps inject into
 * the Earn page) — no relay and no pairing; which EVM chain is read from `asset`
 *
 * Everything except `user` is externally triggered; `tonconnect_*` / `walletconnect` /
 * `evm_injected` are dapp origins. For dapp origins also set `app_id` (catalog dapps, joins to
 * dapp_* events) and/or `dapp_url` (any dapp, matches dapp_url on tc_* events).
 * The values mirror `from` on the send_* events, minus the in-wallet screen variants
 * that all collapse into `user`.
 *
 */
export type InitiatedBySchema = 'user' | 'deep_link' | 'qr_code' | 'tonconnect_local' | 'tonconnect_remote' | 'walletconnect' | 'evm_injected';
