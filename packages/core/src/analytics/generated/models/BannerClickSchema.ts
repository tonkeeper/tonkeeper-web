/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BannerActionTypeSchema } from './BannerActionTypeSchema';
import type { BannerPlacementSchema } from './BannerPlacementSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * Fired when the user taps a banner that has an action (a deeplink or an external link). Banners without an action do not fire. CTR is banner_click / banner_view matched on banner_id; unique clickers come from the auto-attached user id. The action field is the intended destination, letting CTR and drop-off be segmented by action type without joining to the banner config. `wallet_mode` distinguishes TON-only from multichain wallets, matching `wallet_open`; `from` says whether the banner was on the wallet main screen or in the Browser section.
 *
 */
export type BannerClickSchema = {
    eventName: string;
    /**
     * Banner identifier from the /banners backend response.
     */
    banner_id: string;
    action: BannerActionTypeSchema;
    wallet_mode: WalletModeSchema;
    from: BannerPlacementSchema;
};

