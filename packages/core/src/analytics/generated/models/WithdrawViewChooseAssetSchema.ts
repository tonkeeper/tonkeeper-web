/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User sees the "Asset to withdraw" screen listing assets available for cross-chain withdrawal (USDT TON, USDT TRON, etc.)
 *
 */
export type WithdrawViewChooseAssetSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    /**
     * Slugs of the options shown to the user on this screen. Use standard identifier slugs from the backend response.
     *
     */
    available_options: Array<string>;
};

