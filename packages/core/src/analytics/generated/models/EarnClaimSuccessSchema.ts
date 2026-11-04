/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired once the claim transaction is confirmed on chain with a success status and the page shows the result. A reverted claim sends earn_claim_failed (reverted) instead, never both.
 *
 */
export type EarnClaimSuccessSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * The rewards claimed.
     */
    reward_amount_usd: number;
};

