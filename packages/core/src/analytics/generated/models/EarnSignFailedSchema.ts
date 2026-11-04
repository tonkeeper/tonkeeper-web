/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { EarnSignMethodSchema } from './EarnSignMethodSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when an Earn request fails and the page gets an error other than 4001: the request cannot be carried out, or the transaction could not be built, signed or broadcast. A transaction that is broadcast and then reverts on chain counts as earn_sign_success — the wallet does not follow a transaction after broadcasting it. Properties other than `error_code` and `error_message` repeat the matching earn_sign_request.
 *
 */
export type EarnSignFailedSchema = {
    eventName: string;
    from: DappAppFromSchema;
    method: EarnSignMethodSchema;
    chain: AssetChainSchema;
    vault_id?: EarnVaultIdSchema;
    /**
     * The client's own code for the failure, such as failed_to_send on iOS. Each platform defines its codes; compare them within a platform.
     *
     */
    error_code: string;
    /**
     * The reason text the error came with, when it has one, for diagnosis. Addresses, hashes and other long hex values are replaced with <hex>.
     *
     */
    error_message?: string;
};

