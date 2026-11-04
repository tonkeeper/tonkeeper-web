/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWalletSourceSchema } from './AddWalletSourceSchema';
import type { LedgerModelSchema } from './LedgerModelSchema';
import type { WalletModeSchema } from './WalletModeSchema';
import type { WalletSourceSchema } from './WalletSourceSchema';
/**
 * Wallet import attempt failed (e.g. invalid recovery phrase). Error fields use the same type/code/message shape as op_terminal for consistent grouping.
 *
 */
export type WalletImportErrorSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    wallet_source: WalletSourceSchema;
    from: AddWalletSourceSchema;
    /**
     * Normalized error category for grouping (matches op_terminal)
     */
    error_type: string | null;
    /**
     * Error code if available (matches op_terminal)
     */
    error_code: number | null;
    /**
     * Human-readable error message (matches op_terminal)
     */
    error_message: string | null;
    ledger_model?: LedgerModelSchema;
};

