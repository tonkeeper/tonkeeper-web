/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Which part of a migration was in flight when it failed. A migration moves assets in a fixed order — TRON USDT, then TRON TRX, then the TON side — and each part is its own set of transactions, so a failure can leave earlier parts already settled on chain.
 * - setup - nothing was sent yet: unsupported wallet kind, passcode or
 * mnemonic access, key derivation, no usable TRON fee method
 * - tron_usdt - the TRON USDT transfer - tron_trx - the TRON TRX transfer - ton - the TON transfer batch (coin, jettons, NFTs)
 *
 */
export type MigrationPartSchema = 'setup' | 'tron_usdt' | 'tron_trx' | 'ton';
