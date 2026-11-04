/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { EarnSignMethodSchema } from './EarnSignMethodSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the wallet has signed an Earn request and handed the result to the page. For send_transaction the transaction was broadcast and the page got its hash; the same submission also emits transaction_sent with initiated_by = evm_injected, which records the submission: its asset is the chain's coin and its amount the transaction's value, 0 for the contract calls a deposit, withdrawal or claim makes. The amount and the vault of the operation are on the page's *_success events. For the message methods the page got the signature. Properties repeat the matching earn_sign_request.
 *
 */
export type EarnSignSuccessSchema = {
    eventName: string;
    from: DappAppFromSchema;
    method: EarnSignMethodSchema;
    chain: AssetChainSchema;
    vault_id?: EarnVaultIdSchema;
};

