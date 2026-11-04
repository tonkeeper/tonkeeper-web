/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWalletSourceSchema } from './AddWalletSourceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * User tapped "Create new wallet", entering the wallet-creation flow
 */
export type WalletCreateStartedSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    from: AddWalletSourceSchema;
};

