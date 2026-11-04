/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
/**
 * Triggered when a dapp has SUCCESSFULLY loaded and is ready in the in-app browser (the webview finished loading). Always preceded by dapp_app_click and emitted only on a successful load: a page the server answers with an HTTP error status is dapp_app_load_failed, not this event, even though the webview finishes rendering the error page. Replaces the legacy dapp_app_open name.
 *
 */
export type DappAppLoadedSchema = {
    eventName: string;
    from: DappAppFromSchema;
    url: UrlSchema;
    asset_chain: AssetChainSchema;
    /**
     * app_id value passed from backend
     */
    app_id: string;
    /**
     * Passed from backend, required if from=banner
     */
    banner_id?: string;
    location: LocationSchema;
    /**
     * Milliseconds from the matching dapp_app_click to this event — how long the dapp took to load.
     *
     */
    load_duration_ms: number;
};

