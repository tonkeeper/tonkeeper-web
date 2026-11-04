/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
/**
 * Triggered when user clicks somewhere from search in a browser session
 */
export type DappBrowserSearchClickSchema = {
    eventName: string;
    url: UrlSchema;
    location: LocationSchema;
};

