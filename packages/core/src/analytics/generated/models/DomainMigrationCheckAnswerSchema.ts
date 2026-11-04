/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the browser comes back from the old domain with its answer to `domain_migration_check`, so only after one with `outcome = sent`. The old domain's "Move my wallets" button does not send it.
 *
 */
export type DomainMigrationCheckAnswerSchema = {
    eventName: string;
    /**
     * `found` - the old domain holds wallets in this browser profile; the offer to move them opens. `none` - it holds none; the wallet opens as usual.
     *
     */
    answer: 'found' | 'none';
};

