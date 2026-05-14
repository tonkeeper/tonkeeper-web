/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User selected a stablecoin to receive on the "Choose asset" screen
 */
export type DepositClickStablecoinSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Stablecoin the user wants to receive, in chain/network/type format: ton/mainnet/jetton/{addr}
     *
     */
    buy_asset: string;
};

