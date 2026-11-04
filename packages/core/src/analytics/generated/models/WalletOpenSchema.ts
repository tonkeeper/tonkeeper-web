/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WalletInterfaceSchema } from './WalletInterfaceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
import type { WalletSourceSchema } from './WalletSourceSchema';
/**
 * Triggered when the user opens a wallet main screen; send again if the user switches to another wallet. The main screen lists all assets across all chains — it is not token-specific — so it carries no `asset` and no aggregate `wallet_network`; only wallet-level identity (`wallet_mode`, `wallet_source`, and the optional `wallet_interface`).
 *
 */
export type WalletOpenSchema = {
    eventName: string;
    wallet_mode: WalletModeSchema;
    wallet_source: WalletSourceSchema;
    wallet_interface?: WalletInterfaceSchema;
};

