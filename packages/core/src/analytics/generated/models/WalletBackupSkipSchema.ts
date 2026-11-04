/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackupSourceSchema } from './BackupSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * User skipped the recovery-phrase backup from the backup screen and proceeds to finish wallet creation without backing up
 *
 */
export type WalletBackupSkipSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    source: BackupSourceSchema;
};

