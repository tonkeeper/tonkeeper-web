/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the user answers the list of arrived wallets.
 */
export type DomainMigrationConfirmClickSchema = {
    eventName: string;
    /**
     * `add` - adds the wallets (after a password check when both domains hold password-protected wallets). `not_mine` - the user says these are not their wallets; nothing is added.
     *
     */
    action: 'add' | 'not_mine';
};

