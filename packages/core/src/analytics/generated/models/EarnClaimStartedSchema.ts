/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the user starts claiming the rewards of a vault: incentive tokens paid on top of the vault's yield (`claim-rewards` in vaults.fyi). Claiming a requested withdrawal is earn_withdraw_success, not this event. The claim ends in earn_claim_success or earn_claim_failed.
 *
 */
export type EarnClaimStartedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
};

