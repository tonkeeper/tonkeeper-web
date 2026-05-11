/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Emitted exactly once per operation when it completes (success, fail, or cancel). Must share operation_id with the corresponding op_attempt.
 */
export type OpTerminalSchema = {
    eventName: string;
    /**
     * Must match the op_attempt event for this operation.
     */
    operation_id: string;
    /**
     * High-level product flow.
     */
    flow: 'transfer' | 'swap' | 'stake' | 'ton_connect';
    /**
     * Operation within the flow.
     */
    operation: 'emulate' | 'send' | 'quote' | 'stake' | 'unstake' | 'connect_wallet' | 'confirm_transaction';
    /**
     * Terminal outcome of the operation.
     */
    outcome: 'success' | 'fail' | 'cancel';
    /**
     * Duration of the operation in milliseconds.
     */
    duration_ms: number;
    /**
     * End time in milliseconds since Unix epoch.
     */
    finished_at_ms: number;
    /**
     * Set when outcome is fail; error code if available.
     */
    error_code?: number | null;
    /**
     * Set when outcome is fail; human-readable error message.
     */
    error_message?: string | null;
    /**
     * Set when outcome is fail; normalized error category for grouping.
     */
    error_type?: string | null;
    /**
     * Set when outcome = {fail,cancel}. Stage where the operation ended. When outcome is fail, stage where failure occurred (e.g. emulate, broadcast).
     * When outcome is cancel, stage where user cancelled.
     *
     */
    stage?: string | null;
    /**
     * Optional. Additional metadata in JSON format that may be relevant for debugging RED metrics,
     * e.g. network for send operation (ton, trc20, etc), provider name, fee payment method.
     *
     */
    other_metadata?: string;
};

