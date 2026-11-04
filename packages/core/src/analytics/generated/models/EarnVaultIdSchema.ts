/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A vault as the Asset ID of its share token, `{chain}/mainnet/erc20/{address}`, lowercase — e.g. `base/mainnet/erc20/0xc1256ae5ff1cf2719d4937adb3bbccab2e00a2ca` — so the chain is in the id and the address can be looked up in an explorer. The chain and the address come from the page's `/earn/{network}/{vaultId}` route; the chain is the AssetChain value of the vaults.fyi network (`mainnet` is eth, `arbitrum` arb, `bsc` bnb).
 *
 */
export type EarnVaultIdSchema = string;
