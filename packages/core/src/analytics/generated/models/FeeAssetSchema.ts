/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * How the network fee was paid (multichain). The canonical fee-payment
 * vocabulary shared across transaction_sent and every native flow
 * (swaps / send / migration / withdraw):
 *
 * - coin: the chain's native currency (TON, ETH, BNB, POL, SOL, TRX, BTC, …) — the
 * specific currency is implied by the transaction's own chain (the first segment
 * of its `asset` Asset ID), so this stays a single generic value across chains.
 * - battery_charges: paid with Battery balance (charges)
 * - battery_ton_instant_fee: paid with a TON instant fee — TON used to cover the fee
 * of a transaction on ANOTHER chain (e.g. a TRC20 send whose fee is covered using
 * TON instead of TRX). This is the only case where the fee currency differs from
 * the transaction's own chain — that's what `coin` cannot express and this value
 * exists for. A TRC20 send whose fee really was paid in TRX is still `coin`; only
 * route it to `battery_ton_instant_fee` when the fee was actually covered in TON.
 * - gasless: sponsored / gasless relay
 *
 */
export type FeeAssetSchema = 'coin' | 'battery_charges' | 'battery_ton_instant_fee' | 'gasless';
