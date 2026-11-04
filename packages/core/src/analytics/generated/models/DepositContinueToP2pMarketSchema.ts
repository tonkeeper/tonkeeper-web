/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * User was sent to the external Wallet P2P flow
 */
export type DepositContinueToP2pMarketSchema = {
    eventName: string;
    from: RampSourceSchema;
    wallet_mode: WalletModeSchema;
    add_funds_option: AddFundsOptionSchema;
};

