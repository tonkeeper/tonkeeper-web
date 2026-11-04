/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
/**
 * Triggered when the page of a dapp fails to load in the in-app browser — the load dapp_app_click started, not a later navigation inside the dapp. It ends the open in place of dapp_app_loaded, so the two never follow the same click. A page that loads and then fails inside — a script error, its own API down, a blank screen — has loaded as far as the browser can tell and reports dapp_app_loaded; only the page itself can report that.
 *
 */
export type DappAppLoadFailedSchema = {
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
     * The client's own code for the failure. iOS sends the domain and code of the load error (NSURLErrorDomain:-1009 for no connection), http_error for an HTTP error status and web_content_process_terminated when the page's process went away. Each platform defines its codes; compare them within a platform.
     *
     */
    error_code: string;
    /**
     * The HTTP error status (400 and above) the server answered the page with; absent for other failures.
     *
     */
    http_status?: number;
    /**
     * Milliseconds from the matching dapp_app_click to the failure.
     */
    load_duration_ms: number;
};

