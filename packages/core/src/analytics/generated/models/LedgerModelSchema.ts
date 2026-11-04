/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Model of the Ledger device the wallet talked to over Bluetooth or USB:
 *
 * - nano_s: Ledger Nano S
 * - nano_s_plus: Ledger Nano S Plus
 * - nano_x: Ledger Nano X
 * - stax: Ledger Stax
 * - flex: Ledger Flex
 * - nano_gen5: Ledger Nano Gen5
 * - atom: Ledger Atom
 * - unknown: a Ledger the client could not identify
 *
 * Set only on events of a Ledger account, and only when the client
 * connected to the device for that step; absent otherwise.
 *
 */
export type LedgerModelSchema = 'nano_s' | 'nano_s_plus' | 'nano_x' | 'stax' | 'flex' | 'nano_gen5' | 'atom' | 'unknown';
