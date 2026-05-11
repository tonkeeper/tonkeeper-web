/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Triggered when user opens a dapp
 */
export type DappAppOpenSchema = {
    eventName: string;
    /**
     * Source from which the dapp was opened
     */
    from: 'banner' | 'browser' | 'browser_search' | 'browser_connected' | 'push' | 'sidebar';
    /**
     * URL domain only, without private information
     */
    url: string;
    /**
     * app_id value passed from backend
     */
    app_id: string;
    /**
     * Passed from backend, required if from=banner
     */
    banner_id?: string;
    /**
     * 2-letter string in ISO-3166 format, passed from backend
     */
    location: string;
};

