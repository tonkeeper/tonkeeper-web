/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the user answers the offer to move wallets.
 */
export type DomainMigrationOfferClickSchema = {
    eventName: string;
    /**
     * `continue` - opens the old domain in a popup to approve sending the wallets. `not_now` - leaves the offer for the wallet.
     *
     */
    action: 'continue' | 'not_now';
};

