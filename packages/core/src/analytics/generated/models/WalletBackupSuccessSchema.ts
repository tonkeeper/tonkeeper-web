/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackupSourceSchema } from './BackupSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * User completed the recovery-phrase backup successfully (passed the seed-phrase check). source tells backup during creation apart from a backup finished later.
 *
 */
export type WalletBackupSuccessSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    source: BackupSourceSchema;
};

