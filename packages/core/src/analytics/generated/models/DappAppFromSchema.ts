/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Source from which a dapp was opened. Shared by dapp_app_click, dapp_app_loaded and dapp_app_load_failed so they stay in lockstep.
 * - banner: in-app banner - browser / browser_search / browser_connected: Browser / Discover
 * surfaces
 * - push: push notification that opens a dapp URL - sidebar: desktop sidebar - deep_link: tonkeeper:// / https:// dapp deep link - history: history event details (explorer / transaction link) - collectibles: collectibles / NFT surface - tonconnect: after a TonConnect (or WalletKit) connect flow, when the
 * client opens the connected dapp's URL
 * - earn_featured / earn_your_vaults / earn_apy: the Earn entry points,
 * each opening the Earn dapp (vaults.fyi) — the "Earn" carousel of
 * featured vaults on the wallet main screen (a vault card or the
 * header that opens the catalog), the "Earn" block on the wallet main
 * screen listing the vaults the user holds (a position row or the
 * header that opens the catalog), and the "Earn up to …% APY" badge on
 * an asset page. Their impressions are earn_entry_view, with the same
 * values (earn-flow.yaml).
 * - dapp: a link a dapp opens in a new tab (window.open /
 * target=_blank), which the in-app browser shows as a new dapp — the
 * hop does not inherit the entry source of the dapp it came from
 * - shortcut: a dapp shortcut pinned to the device home screen - other: an in-app entry point that has no value of its own in this
 * list; the event is sent with other instead of being dropped
 *
 */
export type DappAppFromSchema = 'banner' | 'browser' | 'browser_search' | 'browser_connected' | 'push' | 'sidebar' | 'deep_link' | 'history' | 'collectibles' | 'tonconnect' | 'earn_featured' | 'earn_your_vaults' | 'earn_apy' | 'dapp' | 'shortcut' | 'other';
