/**
 * Compatibility layer for multiplatform fee module.
 *
 * The fee algorithm was ported from tonkeeper-multiplatform where it uses
 * TonWalletVersion (string enum) and assertUnreachable from different paths.
 * This file re-exports them so the algorithm code stays untouched.
 */

export { assertUnreachable } from '../../../utils/types';

/**
 * TonWalletVersion mirrors the multiplatform enum exactly.
 * The web repo uses WalletVersion (numeric enum) from entries/wallet.ts,
 * but this module uses the string enum for algorithm compatibility.
 */
export enum TonWalletVersion {
    V3R1 = 'V3R1',
    V3R2 = 'V3R2',
    V4R2 = 'V4R2',
    V5R1 = 'V5R1'
}

/**
 * Minimal blockchain config interface for fee calculation.
 * Only the fields actually used by extractFeeConfig() are declared.
 * Both @ton-api/client's BlockchainConfig and tonApiV2's BlockchainConfig
 * satisfy this interface structurally.
 */
export interface FeeBlockchainConfig {
    '18'?: {
        storagePrices?: Array<{
            bitPricePs?: number;
            cellPricePs?: number;
        }>;
    };
    '20'?: { gasLimitsPrices?: { gasPrice?: number } };
    '21'?: { gasLimitsPrices?: { gasPrice?: number } };
    '24'?: {
        msgForwardPrices?: {
            lumpPrice?: number;
            bitPrice?: number;
            cellPrice?: number;
            firstFrac?: number;
        };
    };
    '25'?: {
        msgForwardPrices?: {
            lumpPrice?: number;
            bitPrice?: number;
            cellPrice?: number;
            firstFrac?: number;
        };
    };
}
