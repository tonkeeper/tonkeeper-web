/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type SubscriptionExtensionMetadata = {
    /**
     * URL to the subscription’s logo image (text, max 255 characters)
     */
    'l': string;
    /**
     * Name of the subscription (text, max 80 characters)
     */
    'n': string;
    /**
     * URL to the source or service the user is subscribing to (e.g., a Telegram channel, max 255 characters)
     */
    'u': string;
    /**
     * Name of the merchant (text, max 80 characters)
     */
    'm': string;
    /**
     * Domain of the merchant’s website (text, max 125 characters)
     */
    'w': string;
    /**
     * Description of the subscription (text, max 255 characters)
     */
    'd'?: string;
    /**
     * URL to the Terms of Service (text, max 255 characters)
     */
    't'?: string;
    /**
     * Tier or category of the subscription (text, max 80 characters)
     */
    'c'?: string;
};

