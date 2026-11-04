/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { EarnSignMethodSchema } from './EarnSignMethodSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the Earn page asks the wallet to sign through the injected `window.ethereum`: every `eth_sendTransaction`, `personal_sign` and `eth_signTypedData_v4` call the wallet can read, before it validates the request or asks for the passcode. Exactly one of earn_sign_success, earn_sign_rejected or earn_sign_failed follows each request. A call whose parameters cannot be read at all is refused without events, and the other provider calls — accounts, chain id, chain switch — are not sent. `from` is the value the page was opened with on dapp_app_click, so a request is attributable to an entry point without a session join; it is a non-Earn value such as browser or deep_link when the page was reached some other way. `chain` is the chain the provider is on. `vault_id` is the vault the page is on (EarnVaultId), absent when the page is not on a vault route — which is why `chain` stays a property of its own.
 *
 */
export type EarnSignRequestSchema = {
    eventName: string;
    from: DappAppFromSchema;
    method: EarnSignMethodSchema;
    chain: AssetChainSchema;
    vault_id?: EarnVaultIdSchema;
};

