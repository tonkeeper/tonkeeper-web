/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User tapped an action button on the asset detail screen
 */
export type AssetButtonClickSchema = {
    eventName: string;
    /**
     * Which action button the user tapped:
     *
     * - buy: opens the native swap flow (asset as buy target), emitting
     * swap_open and, on completion, swap_success
     * - sell: opens the native swap flow (asset as sell source), emitting
     * swap_open and, on completion, swap_success
     * - send: opens the send flow
     * - receive: opens the receive screen
     *
     */
    button: 'buy' | 'sell' | 'send' | 'receive';
    /**
     * Asset on which the action was triggered, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    asset: string;
};

