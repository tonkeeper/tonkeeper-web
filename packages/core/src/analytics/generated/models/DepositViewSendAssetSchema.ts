/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { AssetSchema } from './AssetSchema';
import type { RampSourceSchema } from './RampSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * User sees the deposit instructions screen with address, min/max amounts, network, and estimated arrival time. Shared across buy_ton_with_crypto and buy_with_stablecoins flows.
 *
 */
export type DepositViewSendAssetSchema = {
    eventName: string;
    from: RampSourceSchema;
    wallet_mode: WalletModeSchema;
    add_funds_option: AddFundsOptionSchema;
    sell_asset: AssetSchema;
    buy_asset: AssetSchema;
};

