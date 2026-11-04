/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when moving wallets from the old domain ends. `uuid_persistent` on this event is the new domain's own id, `legacy_user_id` the old domain's; after a successful import of a profile that had no wallets on the new domain, the new domain takes over the old id, so later events carry `legacy_user_id` as their `uuid_persistent`.
 *
 */
export type DomainMigrationImportResultSchema = {
    eventName: string;
    /**
     * `success` - the wallets were added. `already_here` - every arrived account is already on the new domain; nothing was added. `failed` - the wallets arrived but could not be added.
     *
     */
    outcome: 'success' | 'already_here' | 'failed';
    /**
     * Accounts added. For `already_here`, the accounts that arrived; for `failed`, the accounts confirmed for import, or 0 when the arrived wallets could not be read at all.
     *
     */
    accounts_count: number;
    /**
     * The old domain's `uuid_persistent`, which arrives with the wallets. Absent when the old domain had none or it was not a valid id.
     *
     */
    legacy_user_id?: string;
};

