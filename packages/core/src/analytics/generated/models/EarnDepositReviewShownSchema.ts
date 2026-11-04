/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the page shows the review of a deposit.
 */
export type EarnDepositReviewShownSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * Network fee the review shows.
     */
    estimated_gas_usd: number;
    /**
     * APY the review shows, in percent.
     */
    estimated_apy: number;
};

