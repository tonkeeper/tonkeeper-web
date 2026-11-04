/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddWalletSourceSchema } from './AddWalletSourceSchema';
/**
 * User sees the Add Wallet menu listing the available ways to add a wallet (New Wallet, Existing Wallet, Pair Signer, Pair with Keystone, Pair with Ledger, ...) — the shared entry point into the create and import flows, both during onboarding and from the main app (wallet switcher). Covers the blind spot of users who open the menu and leave without picking any option. The option the user picks is not a separate event — it is read from the follow-up wallet_create_started or wallet_import_started {wallet_source}. from tells the onboarding and main-app contexts apart.
 *
 */
export type AddWalletMenuViewSchema = {
    eventName: string;
    from: AddWalletSourceSchema;
};

