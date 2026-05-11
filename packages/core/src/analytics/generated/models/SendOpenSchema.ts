/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User opened the send screen
 */
export type SendOpenSchema = {
    eventName: string;
    /**
     * Source location where send was opened:
     * | wallet_screen: main wallet screen
     * | jetton_screen: jetton info screen
     * | deep_link: from deep link
     * | tonconnect_local: initiated by dapp on the same device
     * | tonconnect_remote: initiated by dapp on another device or browser
     * | qr_code: user scans a QR code
     *
     */
    from: 'wallet_screen' | 'jetton_screen' | 'deep_link' | 'tonconnect_local' | 'tonconnect_remote' | 'qr_code';
};

