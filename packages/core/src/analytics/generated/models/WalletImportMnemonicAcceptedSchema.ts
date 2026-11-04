/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWalletSourceSchema } from './AddWalletSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
import type { WalletSourceSchema } from './WalletSourceSchema';
/**
 * Recovery phrase passed validation and the import continued. An invalid phrase is wallet_import_error, not this event. A phrase that belongs to a wallet already in the app does not emit it.
 *
 */
export type WalletImportMnemonicAcceptedSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    wallet_source: WalletSourceSchema;
    from: AddWalletSourceSchema;
};

