/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWalletSourceSchema } from './AddWalletSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * Wallet creation finished. Reached either after skipping backup (wallet_backup_skip) or after completing it (wallet_backup_success).
 *
 */
export type WalletCreateSuccessSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    /**
     * true if the recovery phrase was backed up (wallet_backup_success), false if the user skipped backup (wallet_backup_skip)
     *
     */
    backed_up: boolean;
    from: AddWalletSourceSchema;
};

