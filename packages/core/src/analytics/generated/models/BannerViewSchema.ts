/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BannerPlacementSchema } from './BannerPlacementSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * Fired when a promo banner becomes the front, fully-visible item of the banner deck (an impression). The deck is a swipeable stack where only the front banner is fully visible, so only the front banner counts; deduped per appearance, so swiping back to a banner already seen in this appearance does not re-fire. The deck is rendered on the wallet main screen and in the Browser section — `from` says which surface fired. Geo and user id are auto-attached by the Aptabase SDK. Together with banner_click this yields impressions, CTR (clicks / views matched on banner_id) and unique viewers / clickers (via the auto-attached user id). `wallet_mode` distinguishes TON-only from multichain wallets, matching `wallet_open`.
 *
 */
export type BannerViewSchema = {
    eventName: string;
    /**
     * Banner identifier from the /banners backend response.
     */
    banner_id: string;
    wallet_mode: WalletModeSchema;
    from: BannerPlacementSchema;
};

