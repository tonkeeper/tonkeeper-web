/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent by the web wallet on its new domain when a browser profile with no wallets there, and not asked before, looks for wallets left on the old domain, before the browser leaves for the old domain. Profiles with wallets, profiles already asked and crawlers do not check and send nothing. A check that was not sent (`unreachable`, `failed`) does not mark the profile as asked, so it runs, and this event is sent, again on every visit until one is sent: count users, not events.
 *
 */
export type DomainMigrationCheckSchema = {
    eventName: string;
    /**
     * `sent` - the browser was sent to the old domain to ask. `unreachable` - the old domain did not answer within 2 seconds, so the wallet opened without asking. `failed` - the browser would not keep the page to return to, or the check failed unexpectedly; the wallet opened without asking.
     *
     */
    outcome: 'sent' | 'unreachable' | 'failed';
};

