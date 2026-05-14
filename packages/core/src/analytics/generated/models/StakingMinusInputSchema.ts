/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User is presented with the unstaking input field
 */
export type StakingMinusInputSchema = {
    eventName: string;
    /**
     * Name of the previous page
     */
    from: string;
    /**
     * Symbol of the jetton being unstaked
     */
    jetton_symbol: string;
    /**
     * Name of the staking provider
     */
    provider_name: string;
    /**
     * Domain of the staking provider
     */
    provider_domain: string;
};

