/**
 * Compatibility layer for multiplatform fee module.
 *
 * The fee algorithm was ported from tonkeeper-multiplatform where it uses
 * TonWalletVersion (string enum) and assertUnreachable from different paths.
 * This file re-exports them so the algorithm code stays untouched.
 */

export { assertUnreachable } from '../../../utils/types';

/**
 * The web repo uses WalletVersion (numeric enum) from entries/wallet.ts,
 * but this module uses the string enum for algorithm compatibility.
 */
export enum TonWalletVersion {
    V3R1 = 'V3R1',
    V3R2 = 'V3R2',
    V4R2 = 'V4R2',
    V5R1 = 'V5R1'
}
