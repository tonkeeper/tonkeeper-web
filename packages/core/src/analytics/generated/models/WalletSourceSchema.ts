/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * How the account is backed (key custody):
 *
 * - mnemonic: recovery-phrase (seed) wallet
 * - ledger: Ledger hardware wallet
 * - signer: external Signer app
 * - keystone: Keystone hardware wallet
 * - privatekey: raw private key
 * - watchonly: imported by address only; cannot sign, so it never appears in signing events such as transaction_sent (but does appear in wallet_open / wallet_import)
 *
 */
export type WalletSourceSchema = 'mnemonic' | 'ledger' | 'signer' | 'keystone' | 'privatekey' | 'watchonly';
