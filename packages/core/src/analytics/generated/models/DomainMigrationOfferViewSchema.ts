/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when the offer to move wallets from the old domain opens. Once per page load.
 *
 */
export type DomainMigrationOfferViewSchema = {
    eventName: string;
    /**
     * `check` - opened by the old domain's `found` answer to `domain_migration_check`. `old_domain` - opened by the "Move my wallets" button on the old domain's "We've moved" screen, shown to people who open the old domain with wallets there. `manual` - opened by hand, from the "I had a wallet on ..." link on the start screen or a direct visit.
     *
     */
    from: 'check' | 'old_domain' | 'manual';
};

