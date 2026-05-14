/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User clicked 'Continue' after entering recipient and amount
 */
export type SendClickSchema = {
    eventName: string;
    /**
     * Source location where send was opened (same value as in send_open event)
     */
    from: 'wallet_screen' | 'jetton_screen' | 'deep_link' | 'tonconnect_local' | 'tonconnect_remote' | 'qr_code';
    /**
     * Network of the asset being sent (e.g., 'ton', 'trc20', 'erc20')
     */
    asset_network: string;
    /**
     * Symbol of the token being sent
     */
    token_symbol: string;
    /**
     * Amount of the token being sent
     */
    amount: number;
};

