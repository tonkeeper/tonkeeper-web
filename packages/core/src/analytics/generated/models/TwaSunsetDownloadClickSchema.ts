/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the user taps the primary button to leave the mini app for a full Tonkeeper client.
 *
 */
export type TwaSunsetDownloadClickSchema = {
    eventName: string;
    /**
     * Where the download / open button sent the user.
     */
    destination: 'app_store' | 'google_play' | 'web';
};

