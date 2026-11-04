/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the user confirms a withdrawal on the review; the page then asks the wallet to sign (earn_sign_request), and the withdrawal ends in earn_withdraw_success or earn_withdraw_failed. A withdrawal that waits reports earn_withdraw_requested in between and stays open until the user claims its funds.
 *
 */
export type EarnWithdrawConfirmTappedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
};

