/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the Receive tokens screen with QR code and address
 */
export type DepositViewReceiveTokensSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Which network tab is selected on the Receive tokens screen
     */
    network: 'TON' | 'TRC20';
};

