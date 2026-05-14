/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the "Payment method" screen listing cryptos that can be swapped into TON (BTC, USDT, ETH, SOL, etc.)
 *
 */
export type DepositViewBuyTonWithCryptoSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Always ton/mainnet/coin in this flow
     */
    buy_asset: 'ton/mainnet/coin';
    /**
     * Slugs of the options shown to the user on this screen. Use standard identifier slugs from the backend response.
     *
     */
    available_options: Array<string>;
};

