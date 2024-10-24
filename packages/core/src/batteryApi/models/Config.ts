/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Config = {
    /**
     * with zero balance it is possible to transfer some jettons (stablecoins, jusdt, etc) to this address to refill the balance. Such transfers would be paid by Battery Service.
     */
    fund_receiver: string;
    /**
     * when building a message to transfer an NFT or Jetton, use this address to send excess funds back to Battery Service.
     */
    excess_account: string;
    /**
     * ttl for message in seconds
     */
    message_ttl: number;
};

