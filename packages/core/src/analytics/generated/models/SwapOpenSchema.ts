/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * User opened the native swap flow
 */
export type SwapOpenSchema = {
    eventName: string;
    /**
     * Type of swap implementation
     */
    type: 'native';
    wallet_mode: WalletModeSchema;
};

