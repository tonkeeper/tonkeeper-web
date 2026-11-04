/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Source location where the deposit/withdraw flow was opened:
 *
 * - wallet_screen: main wallet screen
 * - jetton_screen: jetton info screen
 * - deep_link: from deep link
 * - qr_code: user scans a QR code
 * - history_screen: history tab / history event details (Add funds)
 * - browser: Browser / Discover section
 * - collectibles: collectibles / NFT surface
 * - perps: Add funds on the Perps deposit screen
 * - walletconnect: top up from a WalletConnect request confirmation that
 * needs more funds than the wallet holds
 * - tonconnect: the same top up from a TonConnect request confirmation
 * - staking: the insufficient-funds sheet of a stake / unstake
 * confirmation
 * - migration: a wallet top up inside the migration to a multichain
 * wallet
 * - other: an in-app entry point that has no value of its own in this
 * list
 *
 */
export type RampSourceSchema = 'wallet_screen' | 'jetton_screen' | 'deep_link' | 'qr_code' | 'history_screen' | 'browser' | 'collectibles' | 'perps' | 'walletconnect' | 'tonconnect' | 'staking' | 'migration' | 'other';
