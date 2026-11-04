/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
/**
 * Triggered when the user TAPS a dapp to open it — the intent / attempt, NOT a successful open. It always comes first, and the open then ends in dapp_app_loaded when the page loads, in dapp_app_load_failed when it fails to load, or in neither when the user leaves before the page answers; a client that does not emit dapp_app_load_failed yet leaves its failures in the last group. The dapp_app_loaded / dapp_app_click ratio, matched on url / app_id, is the dapp-open success rate.
 *
 */
export type DappAppClickSchema = {
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
};

