/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
/**
 * User clicked 'Continue' after entering recipient and amount
 */
export type SendClickSchema = {
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
};

