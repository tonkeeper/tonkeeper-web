/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Send transaction failed
 */
export type SendFailedSchema = {
    eventName: string;
    /**
     * Source location where send was opened (same value as in send_open event)
     */
    from: 'wallet_screen' | 'jetton_screen' | 'deep_link' | 'tonconnect_local' | 'tonconnect_remote' | 'qr_code';
    /**
     * Network of the asset being sent
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
    /**
     * Method used to pay network fees
     */
    fee_paid_in: 'ton' | 'trx' | 'battery' | 'gasless' | 'free';
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

