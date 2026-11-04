/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnPageScreenSchema } from './EarnPageScreenSchema';
/**
 * Fired every time the page shows another screen, the first one after the page loads included.
 *
 */
export type EarnWebviewScreenViewSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    screen_name: EarnPageScreenSchema;
};

