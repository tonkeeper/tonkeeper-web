/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the "Buy via Wallet P2P" modal screen
 */
export type DepositViewP2pAlertSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
};

