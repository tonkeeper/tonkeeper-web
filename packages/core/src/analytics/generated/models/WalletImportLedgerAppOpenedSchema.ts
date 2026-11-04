/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWalletSourceSchema } from './AddWalletSourceSchema';
import type { LedgerModelSchema } from './LedgerModelSchema';
import type { WalletModeSchema } from './WalletModeSchema';
import type { WalletSourceSchema } from './WalletSourceSchema';
/**
 * TON app on the connected Ledger reported itself open during import.
 *
 */
export type WalletImportLedgerAppOpenedSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    wallet_source: WalletSourceSchema;
    from: AddWalletSourceSchema;
    ledger_model?: LedgerModelSchema;
};

