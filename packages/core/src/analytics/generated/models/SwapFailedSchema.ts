/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Swap failed
 */
export type SwapFailedSchema = {
    eventName: string;
    /**
     * Type of swap implementation
     */
    type: 'native';
    /**
     * Error message returned for the failed swap
     */
    error_message: string;
    /**
     * Currency used to pay network fees
     */
    fee_paid_in: 'ton' | 'battery';
    /**
     * Symbol of the jetton being swapped from
     */
    jetton_symbol_from: string;
    /**
     * Symbol of the jetton being swapped to
     */
    jetton_symbol_to: string;
    /**
     * Name of the swap provider
     */
    provider_name: string;
};

