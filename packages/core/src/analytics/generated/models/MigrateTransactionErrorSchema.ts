/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeeAssetSchema } from './FeeAssetSchema';
import type { MigrationPartSchema } from './MigrationPartSchema';
/**
 * User failed to send the migration transaction. Error fields use the same type/code/message as the op_terminal event for consistent grouping.
 *
 */
export type MigrateTransactionErrorSchema = {
    eventName: string;
    fee_asset: FeeAssetSchema;
    failed_part: MigrationPartSchema;
    /**
     * true when an earlier part had already been broadcast, so some assets did move despite this event and the migration is now half-done. Always false for failed_part = setup and for the first part that actually sends anything — a part with a zero amount is skipped and does not count. Subtract these from the failure count when reading migrate_transaction_success as "migrations completed".
     * Tracks whole parts only. The ton part is itself a batch of transactions (coin, jettons, NFTs), so failing midway through it can also leave assets moved while is_partial stays false.
     *
     */
    is_partial: boolean;
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

