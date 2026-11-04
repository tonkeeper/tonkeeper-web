/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
/**
 * Fired when the user applies a filter to the vault list.
 */
export type EarnVaultFilterAppliedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    /**
     * What the filter narrows by, such as `chain`, `asset` or `protocol`.
     */
    filter_type: string;
};

