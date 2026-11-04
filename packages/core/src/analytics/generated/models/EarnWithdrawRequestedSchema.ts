/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired, for a vault whose withdrawals wait, once the request transaction (`request` in vaults.fyi) is confirmed on chain with a success status. The funds reach the wallet only after the waiting period, when the user claims them (earn_withdraw_success). A vault that pays out at once skips this event.
 *
 */
export type EarnWithdrawRequestedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * The amount requested.
     */
    amount_usd: number;
};

