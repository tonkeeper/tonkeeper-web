/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
/**
 * Preparing the migration failed, so the confirmation screen could not be shown in a confirmable state. Complements migrate_transaction_error, which only covers failures of the send itself: together with migrate_transaction_confirmation_view this accounts for every user who reached the confirmation screen. Preparation runs per chain, so one visit can emit one event per chain, and retrying the screen re-emits. Error fields use the same type/code/message as the op_terminal event for consistent grouping.
 * Only chains that actually hold assets are prepared: a wallet with no TRON assets never emits chain = tron. A missing event means the chain was absent or prepared fine — never that it silently failed. To tell a one-chain wallet from a two-chain wallet where both chains failed, count the events in the visit, not their absence.
 *
 */
export type MigrateTransactionPrepareErrorSchema = {
    eventName: string;
    chain: AssetChainSchema;
    /**
     * true when the flow cannot proceed at all; false when the other chain is still migratable and the flow goes on with it. Either chain can be the one that drops out, and false covers two shapes that look different to the user: a fee shortfall the client offers to skip, and a preparation error dropped silently while the migration continues on the other chain alone. So false does not imply the user saw a prompt.
     *
     */
    is_blocking: boolean;
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

