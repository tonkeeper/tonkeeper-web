/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationSchema } from './LocationSchema';
/**
 * Triggered when user clicks a Browser/Discover tab
 */
export type DappBrowserTabClickSchema = {
    eventName: string;
    /**
     * Browser tab selected by the user
     */
    type: 'explore' | 'connected';
    location: LocationSchema;
};

