/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A link opened the app: a `tonkeeper://` / `ton://` app link, or a universal `https://app.tonkeeper.com/...` link — either launching the app or arriving while it was already running. Sent once per link, before the app routes it, so links the app cannot use are visible too (`link_type: unknown`). A push tap is not counted here: it reports `push_click`, and links opened from inside the app (banners, stories, dapps) report their own placement events.
 *
 */
export type DeeplinkOpenSchema = {
    eventName: string;
    /**
     * How the link reached the app: `app_link` for a custom URL scheme (`tonkeeper://`, `ton://`, `tc://`), `universal_link` for an `https://` link resolved through the associated domain.
     *
     */
    from: 'app_link' | 'universal_link';
    /**
     * What the link asks the app to open, taken from the parsed link. `main` is a bare link with no destination; `unknown` is a link the app could not parse, which is what a broken campaign link looks like.
     *
     */
    link_type: 'transfer' | 'staking' | 'pool' | 'swap' | 'deposit' | 'withdraw' | 'action' | 'publish' | 'external_sign' | 'tonconnect' | 'wallet_connect' | 'dapp' | 'battery' | 'browser' | 'migration' | 'trading' | 'trade_asset' | 'story' | 'receive' | 'backup' | 'add_wallet' | 'main' | 'raffle' | 'unknown';
    /**
     * `true` when the link launched the app, `false` when it arrived while the app was already running.
     *
     */
    is_cold_start: boolean;
};

