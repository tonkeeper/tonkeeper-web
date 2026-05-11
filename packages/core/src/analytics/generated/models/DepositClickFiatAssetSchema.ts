/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User selected an asset on the "Choose asset" screen
 */
export type DepositClickFiatAssetSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Asset the user wants to buy, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    buy_asset: string;
};

