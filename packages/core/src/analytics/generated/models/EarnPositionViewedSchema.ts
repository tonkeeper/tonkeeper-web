/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the page shows one of the user's positions: the user opens it from the positions screen, or a vault the user holds a position in opens — from the list or right on its route.
 *
 */
export type EarnPositionViewedSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * The position's current value.
     */
    balance_usd: number;
    /**
     * Yield the position has earned so far.
     */
    accrued_yield_usd: number;
};

