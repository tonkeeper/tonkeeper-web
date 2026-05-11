/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Emitted once per user operation attempt. Use same operation_id in the corresponding op_terminal event.
 */
export type OpAttemptSchema = {
    eventName: string;
    /**
     * Unique id for this attempt; must match the op_terminal event for the same operation.
     */
    operation_id: string;
    /**
     * High-level product flow.
     */
    flow: 'transfer' | 'swap' | 'stake' | 'ton_connect';
    /**
     * Operation within the flow. transfer: emulate | send.
     * swap: quote | emulate | send. stake: stake | unstake.
     * ton_connect: connect_wallet | confirm_transaction.
     *
     */
    operation: 'emulate' | 'send' | 'quote' | 'stake' | 'unstake' | 'connect_wallet' | 'confirm_transaction';
    /**
     * Optional. Where the attempt originated (e.g. native_ui, tonconnect_local, tonconnect_remote).
     */
    attempt_source?: string;
    /**
     * Start time of the operation in milliseconds since Unix epoch.
     */
    started_at_ms: number;
    /**
     * Optional. Additional metadata in JSON format that may be relevant for debugging RED metrics,
     * e.g. network for send operation (ton, trc20, etc), provider name, fee payment method.
     *
     */
    other_metadata?: string;
};

