/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { EarnSignMethodSchema } from './EarnSignMethodSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the user declines an Earn request by dismissing the passcode prompt; the page gets the standard 4001 (user rejected the request) error. A request has no timeout — it waits until the user answers. Properties repeat the matching earn_sign_request.
 *
 */
export type EarnSignRejectedSchema = {
    eventName: string;
    from: DappAppFromSchema;
    method: EarnSignMethodSchema;
    chain: AssetChainSchema;
    vault_id?: EarnVaultIdSchema;
};

