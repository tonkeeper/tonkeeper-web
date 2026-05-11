/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the deposit instructions screen with address, min/max amounts, network, and estimated arrival time. Shared across buy_ton_with_crypto and buy_with_stablecoins flows.
 *
 */
export type DepositViewSendAssetSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Asset the user is sending, in chain/network/type format: ton/mainnet/jetton/{addr}, eth/mainnet/token/{addr}, ton/mainnet/coin, btc/mainnet/coin
     *
     */
    sell_asset: string;
    /**
     * Asset the user will receive, in chain/network/type format: ton/mainnet/jetton/{addr}, eth/mainnet/token/{addr}, ton/mainnet/coin, btc/mainnet/coin
     *
     */
    buy_asset: string;
};

