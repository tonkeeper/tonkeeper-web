/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User selected an asset on the "Asset to withdraw" screen
 */
export type WithdrawClickAssetSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    /**
     * Asset the user wants to withdraw, in chain/network/type format: ton/mainnet/jetton/{addr}, tron/mainnet/trc20/{addr}
     *
     */
    sell_asset: string;
};

