/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when a vault opens: the user opens it from the list, or the page opens right on its `/earn/{network}/{vaultId}` route, the way the wallet's Earn entry points — a carousel card, a position row, an asset's APY badge — open it.
 *
 */
export type EarnVaultSelectedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * True when the page opened right on the vault's route rather than through its own navigation.
     *
     */
    is_initial_route: boolean;
    asset: AssetSchema;
    /**
     * APY the page shows for the vault, in percent, e.g. 4.25.
     */
    apy: number;
    /**
     * TVL the page shows for the vault.
     */
    tvl_usd: number;
    /**
     * Risk score the page shows for the vault; absent when it has none.
     */
    risk_score?: number;
};

