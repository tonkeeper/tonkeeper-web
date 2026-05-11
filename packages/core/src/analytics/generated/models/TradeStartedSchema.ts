/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User entered the Trade page
 */
export type TradeStartedSchema = {
    eventName: string;
    /**
     * Source location where the Trade page was opened:
     * | wallet_screen: main wallet screen
     * | jetton_screen: jetton info screen
     * | tab_bar: bottom tab bar
     * | deep_link: from deep link
     * | qr_code: user scans a QR code
     *
     */
    from: 'wallet_screen' | 'jetton_screen' | 'tab_bar' | 'deep_link' | 'qr_code';
};

