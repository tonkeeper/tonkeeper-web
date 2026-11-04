/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { FeeAssetSchema } from './FeeAssetSchema';
/**
 * Send transaction failed
 */
export type SendFailedSchema = {
    eventName: string;
    /**
     * Source location where send was opened (same value as in send_open event)
     */
    from: 'wallet_screen' | 'jetton_screen' | 'deep_link' | 'tonconnect_local' | 'tonconnect_remote' | 'qr_code' | 'walletconnect';
    asset: AssetSchema;
    /**
     * Amount of the token being sent
     */
    amount: number;
    fee_asset: FeeAssetSchema;
    /**
     * Error code for the failed send
     */
    error_code: number;
    /**
     * Error message for the failed send
     */
    error_message: string;
    /**
     * Required if from=tonconnect_local; same as app_id in dapp_* events
     */
    app_id?: string;
};

