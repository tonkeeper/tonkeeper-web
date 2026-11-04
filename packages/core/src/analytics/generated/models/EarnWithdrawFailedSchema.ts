/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnOperationErrorCodeSchema } from './EarnOperationErrorCodeSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when a withdrawal the user confirmed does not complete — for a withdrawal that waits, either its request or the later claim of its funds: the user declines in the wallet, the wallet fails, the page cannot prepare the transaction, or the transaction reverts on chain.
 *
 */
export type EarnWithdrawFailedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    error_code: EarnOperationErrorCodeSchema;
    /**
     * The reason text of the failure, for diagnosis. Addresses, hashes and other long hex values are replaced with <hex>.
     *
     */
    error_message?: string;
};

