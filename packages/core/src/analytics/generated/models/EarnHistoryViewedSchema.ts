/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
/**
 * Fired when the user opens the history of their operations.
 */
export type EarnHistoryViewedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
};

