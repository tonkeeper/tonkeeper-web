/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the withdrawn funds are in the wallet — once the transaction that pays them out is confirmed on chain with a success status: the withdrawal itself for a vault that pays out at once, or the claim of a requested withdrawal after its waiting period (`claim-redeem` in vaults.fyi, after earn_withdraw_requested). A reverted transaction sends earn_withdraw_failed (reverted) instead, never both.
 *
 */
export type EarnWithdrawSuccessSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * The amount withdrawn.
     */
    amount_usd: number;
};

