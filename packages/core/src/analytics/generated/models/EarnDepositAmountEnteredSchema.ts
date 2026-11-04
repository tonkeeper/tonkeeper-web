/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarnEventProviderSchema } from './EarnEventProviderSchema';
import type { EarnExternalWebViewSchema } from './EarnExternalWebViewSchema';
import type { EarnVaultIdSchema } from './EarnVaultIdSchema';
/**
 * Fired when the user continues from the deposit form with an amount — once per continue, not on every keystroke.
 *
 */
export type EarnDepositAmountEnteredSchema = {
    eventName: string;
    isExternalWebView: EarnExternalWebViewSchema;
    eventProvider: EarnEventProviderSchema;
    vault_id: EarnVaultIdSchema;
    /**
     * The amount entered.
     */
    amount_usd: number;
    /**
     * True when the user chose the whole balance.
     */
    is_max: boolean;
};

