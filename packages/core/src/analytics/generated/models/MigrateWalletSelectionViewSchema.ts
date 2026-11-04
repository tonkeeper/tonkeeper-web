/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * The migration wallet picker ("Choose wallets to migrate") listed at least one wallet. Emitted when the list renders, not when the screen opens: a user with no legacy TON wallet holding assets, or a failed load, sees the screen but no picker and emits nothing. So the gap between migration_start and this event is "had nothing to migrate", while the gap between this event and migrate_wallet_selection_click is a real choice not made.
 *
 */
export type MigrateWalletSelectionViewSchema = {
    eventName: string;
};

