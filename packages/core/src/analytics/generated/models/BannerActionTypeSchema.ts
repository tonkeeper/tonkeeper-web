/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * The action a banner leads to, derived from the banner's deeplink destination. Sent with banner_click as the intended destination at click time, so CTR and drop-off can be segmented by action type without joining to the banner config.
 * - deposit - buy / top up (fiat -> crypto, buy TON) - withdraw - sell (crypto -> fiat) - swap - token swap - staking - stake / unstake - battery - battery (gas) purchase - send - send / transfer - trade - trade UI (markets, asset trading) - exchange - external exchange provider - dapp - opens a dapp / the in-app browser - other - anything else, incl. external web links
 *
 */
export type BannerActionTypeSchema = 'deposit' | 'withdraw' | 'swap' | 'staking' | 'battery' | 'send' | 'trade' | 'exchange' | 'dapp' | 'other';
