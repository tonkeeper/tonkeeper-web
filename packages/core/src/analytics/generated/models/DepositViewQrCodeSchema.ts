/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User opened the Payment QR code screen to scan or copy the deposit address. Shared across buy_ton_with_crypto and buy_with_stablecoins flows.
 *
 */
export type DepositViewQrCodeSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Carried from deposit_view_send_asset
     */
    sell_asset: string;
    /**
     * Carried from deposit_view_send_asset
     */
    buy_asset: string;
};

