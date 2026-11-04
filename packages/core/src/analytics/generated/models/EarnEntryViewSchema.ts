/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { EarnEntryPointSchema } from './EarnEntryPointSchema';
/**
 * Fired when an Earn entry point is shown: the carousel of featured vaults or the block of the wallet's own vaults on the wallet main screen, or the APY badge on an asset page. Once per appearance of the screen that holds it — coming back to the screen or switching to another wallet is a new appearance, scrolling and redrawing are not. Not sent while the entry point is still waiting for its data, nor for the row that offers a retry when the wallet's positions could not be loaded at all; a block drawn from the last saved positions after a failed refresh is sent. Together with dapp_app_click (from = the same value) this yields CTR per entry point; unique viewers come from the auto-attached user id. `vaults_count` is the number of cards in the carousel (earn_featured) or of position rows (earn_your_vaults) and is absent for earn_apy, which always leads to one vault. `balance_usd` is set for earn_your_vaults only. `asset` is set for earn_apy only — the asset whose page shows the badge.
 *
 */
export type EarnEntryViewSchema = {
    eventName: string;
    from: EarnEntryPointSchema;
    /**
     * Vaults the entry point shows — carousel cards for earn_featured, position rows for earn_your_vaults; absent for earn_apy.
     *
     */
    vaults_count?: number;
    /**
     * USD value of all Earn positions of the wallet — the total in the header of the "Earn" block; earn_your_vaults only.
     *
     */
    balance_usd?: number;
    asset?: AssetSchema;
};

