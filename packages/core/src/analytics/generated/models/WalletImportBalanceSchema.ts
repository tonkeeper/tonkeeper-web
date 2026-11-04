/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWalletSourceSchema } from './AddWalletSourceSchema';
import type { BalanceBucketSchema } from './BalanceBucketSchema';
import type { WalletModeSchema } from './WalletModeSchema';
import type { WalletSourceSchema } from './WalletSourceSchema';
/**
 * What the imported wallet already held, as a range in US dollars (balance_bucket): the money a user brought to Tonkeeper without a deposit. The balance counts verified assets only (dust included) at import time; several versions of one recovery phrase share one TRON account, which is counted once. Sent once per import, after wallet_import_success, as soon as the balance of the imported wallet loads (a multichain wallet's once it has finished syncing); when one import adds several wallets (several versions of the same recovery phrase), balance_bucket is the range of their sum. Not sent for a watch-only import, whose money stays with keys outside the app, for a testnet import, or when the balance could not be loaded (including a multichain wallet that failed to sync or did not sync within two minutes). Android only for now; iOS does not send it yet.
 *
 */
export type WalletImportBalanceSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    wallet_source: WalletSourceSchema;
    from: AddWalletSourceSchema;
    balance_bucket: BalanceBucketSchema;
};

