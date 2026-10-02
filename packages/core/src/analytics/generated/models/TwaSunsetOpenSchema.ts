/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent once per session when the deprecated Telegram Mini App sunset screen ("Mini App closed") renders. The primary reach metric for the wind-down - distinct sessions and users still opening the mini app.
 *
 */
export type TwaSunsetOpenSchema = {
    eventName: string;
    /**
     * The Telegram client platform reported in the mini app launch params.
     *
     */
    telegram_platform?: 'ios' | 'android' | 'android_x' | 'web' | 'other';
    /**
     * Whether the user has at least one recoverable (mnemonic) wallet still stored in the mini app.
     *
     */
    has_wallets?: boolean;
    /**
     * Number of recoverable wallets shown in the recovery list.
     */
    wallets_count?: number;
};

