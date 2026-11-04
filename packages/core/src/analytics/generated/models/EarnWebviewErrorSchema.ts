/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnPageErrorTypeSchema } from './EarnPageErrorTypeSchema';
/**
 * Fired when something fails inside the loaded page — a request, the page's server, or its own script — and, once per page load, when the page has no wallet it can work with (wallet_unavailable). A page that does not load at all is the wallet's dapp_app_load_failed.
 *
 */
export type EarnWebviewErrorSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    error_type: EarnPageErrorTypeSchema;
    /**
     * The page's own text of the error, for diagnosis. Addresses, hashes and other long hex values are replaced with <hex>.
     *
     */
    error_message?: string;
};

