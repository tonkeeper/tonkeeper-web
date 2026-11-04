/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the old domain's popup ends, once per popup. A popup is also opened by "Try again" after `rejected`, so there can be more results than `domain_migration_offer_click` with `continue`.
 *
 */
export type DomainMigrationPopupResultSchema = {
    eventName: string;
    /**
     * `approved` - the user approved and the wallets arrived. `none` - the old domain holds no wallets in this profile. `declined` - the user declined on the old domain. `closed` - the popup was closed or cancelled before an answer. `blocked` - the browser blocked the popup. `rejected` - an answer arrived but could not be verified or read, so nothing was imported.
     *
     */
    outcome: 'approved' | 'none' | 'declined' | 'closed' | 'blocked' | 'rejected';
};

