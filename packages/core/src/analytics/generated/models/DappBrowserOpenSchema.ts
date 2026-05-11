/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Triggered when user opens the Browser/Discover section
 */
export type DappBrowserOpenSchema = {
    eventName: string;
    /**
     * Source from which the dapp browser was opened
     */
    from: 'wallet' | 'history' | 'deep-link' | 'story';
    /**
     * Which tab is opened at the top (explore or connected dapps)
     */
    type: 'explore' | 'connected';
    /**
     * 2-letter string in ISO-3166 format, passed from backend
     */
    location: string;
};

