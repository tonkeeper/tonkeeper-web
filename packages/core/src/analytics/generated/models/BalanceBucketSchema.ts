/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * A balance in US dollars as a range instead of the exact amount. An
 * exact balance can single out a wallet on chain, and with it a person,
 * while events must not identify people directly. The lower bound is
 * included, the upper one is not:
 *
 * - 0: nothing at all (an empty wallet)
 * - 0-1: more than $0, under $1
 * - 1-10: from $1, under $10
 * - 10-100: from $10, under $100
 * - 100-1k: from $100, under $1,000
 * - 1k-10k: from $1,000, under $10,000
 * - 10k-100k: from $10,000, under $100,000
 * - 100k+: $100,000 and more
 *
 */
export type BalanceBucketSchema = '0' | '0-1' | '1-10' | '10-100' | '100-1k' | '1k-10k' | '10k-100k' | '100k+';
