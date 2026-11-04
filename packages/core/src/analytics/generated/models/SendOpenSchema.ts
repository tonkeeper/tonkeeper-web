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
     *
     * - wallet_screen: main wallet screen
     * - jetton_screen: jetton info screen
     * - deep_link: from deep link
     * - tonconnect_local: initiated by dapp on the same device
     * - tonconnect_remote: initiated by dapp on another device or browser
     * - qr_code: user scans a QR code
     * - walletconnect: requested by a dapp over WalletConnect
     *
     * walletconnect stays a single flat value with no local / remote split,
     * unlike tonconnect_*: it mirrors `initiated_by` on transaction_sent,
     * which is flat too, and keeping the two vocabularies identical matters
     * more than the transport detail. WalletConnect sends carry no dapp_url
     * here — dapp identity for them lives on transaction_sent.
     *
     */
    from: 'wallet_screen' | 'jetton_screen' | 'deep_link' | 'tonconnect_local' | 'tonconnect_remote' | 'qr_code' | 'walletconnect';
};

