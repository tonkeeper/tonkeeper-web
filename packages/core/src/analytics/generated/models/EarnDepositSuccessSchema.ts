/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired once the deposit's last transaction is confirmed on chain with a success status and the page shows the result. A deposit whose transaction reverts sends earn_deposit_failed (reverted) instead, never both.
 *
 */
export type EarnDepositSuccessSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * The amount deposited.
     */
    amount_usd: number;
};

