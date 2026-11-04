/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LocationSchema } from './LocationSchema';
/**
 * Triggered when user opens the Browser/Discover section
 */
export type DappBrowserOpenSchema = {
    eventName: string;
    /**
     * Source from which the dapp browser was opened.
     * - wallet: the Browser tab in the bottom bar - history: a browser link the app opened from history - deep_link: a browser link from outside the app (a deep link, a
     * push, a scanned QR code), whatever its from query parameter says;
     * the campaign behind such a link travels in utm_*
     * - story: a browser link opened from a story - connected_apps: the "Explore apps" button on the empty Connected
     * apps screen in Settings
     * - other: a browser link the app opened itself whose from query
     * parameter has no value of its own in this list
     *
     */
    from: 'wallet' | 'history' | 'deep_link' | 'story' | 'connected_apps' | 'other';
    /**
     * Which tab is opened at the top (explore or connected dapps)
     */
    type: 'explore' | 'connected';
    location: LocationSchema;
};

