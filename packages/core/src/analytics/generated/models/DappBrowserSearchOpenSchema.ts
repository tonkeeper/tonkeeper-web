/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
/**
 * Triggered when user makes a search request in the browser
 */
export type DappBrowserSearchOpenSchema = {
    eventName: string;
    url: UrlSchema;
    location: LocationSchema;
};

