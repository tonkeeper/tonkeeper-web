/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
/**
 * Fired when the page shows the vault list, and again when a filter or a sort changes what it shows.
 *
 */
export type EarnVaultListViewedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    /**
     * Vaults in the list.
     */
    vaults_count: number;
    /**
     * Chains of the listed vaults, as comma-separated AssetChain values in alphabetical order, e.g. `arb,base,eth`.
     *
     */
    chains_shown: string;
    /**
     * Token symbols the listed vaults take, comma-separated in alphabetical order, e.g. `USDC,USDT,WETH`.
     *
     */
    assets_shown: string;
};

