/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
/**
 * Fired when the user opens an outside link from the page: the terms, the risk disclosure, the documentation, a protocol's site or an explorer.
 *
 */
export type EarnExternalLinkClickedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    /**
     * The URL the link opens, without its query string and fragment. A user's address or a transaction hash in it — an explorer link, for example — is replaced with <hex>.
     *
     */
    url: string;
};

