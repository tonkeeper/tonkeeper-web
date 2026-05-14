/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Triggered when user clicks somewhere from search in a browser session
 */
export type DappBrowserSearchClickSchema = {
    eventName: string;
    /**
     * URL domain only, without private information
     */
    url: string;
    /**
     * 2-letter string in ISO-3166 format, passed from backend
     */
    location: string;
};

