/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the list of arrived wallets is shown for the user to confirm before anything is written. Not sent when every arrived account is already on the new domain: the flow then goes straight to `domain_migration_import_result` with `already_here`.
 *
 */
export type DomainMigrationConfirmViewSchema = {
    eventName: string;
    /**
     * Accounts in the list (its rows), the ones that will be added. One account can hold several wallets.
     *
     */
    accounts_count: number;
    /**
     * Arrived accounts left out of the list because this browser profile already has them on the new domain.
     *
     */
    already_here_accounts_count: number;
};

