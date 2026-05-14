/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * After filling in swap info, user on SWAP screen clicked CONTINUE action button
 */
export type SwapClickSchema = {
    eventName: string;
    /**
     * Type of swap implementation
     */
    type: 'native';
    /**
     * Symbol of the jetton being swapped from
     */
    jetton_symbol_from: string;
    /**
     * Symbol of the jetton being swapped to
     */
    jetton_symbol_to: string;
};

