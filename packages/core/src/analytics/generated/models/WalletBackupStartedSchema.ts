/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BackupSourceSchema } from './BackupSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * User is presented with the "Back up your recovery phrase" screen — during wallet creation or when entering the backup flow later from the wallet main screen setup section or settings (see source)
 *
 */
export type WalletBackupStartedSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    source: BackupSourceSchema;
};

