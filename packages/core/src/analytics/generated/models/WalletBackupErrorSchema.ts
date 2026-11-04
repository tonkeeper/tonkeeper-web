/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackupSourceSchema } from './BackupSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * Backup attempt failed (e.g. recovery-phrase confirmation mismatch). Error fields use the same type/code/message shape as op_terminal for consistent grouping.
 *
 */
export type WalletBackupErrorSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    source: BackupSourceSchema;
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
};

