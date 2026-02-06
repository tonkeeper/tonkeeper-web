/**
 * V5R1 Remove Extension - LEAF Sibling Case
 * https://tonviewer.com/transaction/6da5c202e99d1d37bd7815c0392044822a3b6384d213a0d8e9cc4010edb6b676
 * in_msg.hash: 7e06fd2ade80900e47bd38db060b9533d09bb9d28a8798fefc52457ec5d508e5
 *
 * Wallet: UQD3KlCnEgNeGs4blSjo03JGyS4Rn1QiWhO7H6hcxaZwpAH6
 * Extension to remove: 0:0000000000000000000000000000000000000000000000000000000000000005 (#9)
 * seqno: 11
 *
 * Purpose: Test remove extension gas calculation with LEAF sibling.
 *
 * REMOVE gas formula:
 *   gas = 5290 + 600×cellLoads + (needsEdgeMerge ? 75 : 0)
 *   where needsEdgeMerge = siblingIsFork || rootCollapse(2→1)
 *
 * When removing #9 (0000...05):
 * - cellLoads = 4 (root → 0-branch → 00-fork → leaf)
 * - sibling = LEAF #8 (0000...04) → siblingIsFork = false
 * - needsEdgeMerge = false → +0 gas
 * - gas = 5290 + 2400 + 0 = 7690 ✓
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// Existing 9 extensions (before removal)
const EXISTING_EXTENSIONS = [
    '613fbe5785a63a981b59e3255f8d94749deadba81d5658d806c6333a1e6a0526', // #1
    'ba6ede4924bdc9ecbd4582c10bfacf1dfdf3e4f1bde5796819e45ff6ea0f8522', // #2
    '4758697a8b9cadbecfe0f102132435465768798a9bacbdcedff0011223344556', // #3
    '5f708192a3b4c5d6e7f8091a2b3c4d5e6f8091a2b3c4d5e6f708192a3b4c5d6e', // #4
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01', // #5
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff02', // #6
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03', // #7
    '0000000000000000000000000000000000000000000000000000000000000004', // #8 (sibling - LEAF)
    '0000000000000000000000000000000000000000000000000000000000000005' // #9 - to be removed
];

export const V5R1_REMOVE_EXT_LEAF_SIBLING: WalletFeeTestCase = {
    txHash: '7e06fd2ade80900e47bd38db060b9533d09bb9d28a8798fefc52457ec5d508e5',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgB7lShTiQGvDWcNypR0abkjZJcIz6oRLQndj9QuYtM4UgMAQDlc2lnbn///xFpQ61cAAAAC0DgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAojDvyCh9biYXrKKfypktoIDRtKjxbZduuSFCMIcHso1YlvnQ+dU11C+JRQvSb2J8VAfHjRjZFLmiBdVymUH3wdHKe5q0=',
        existingExtensions: EXISTING_EXTENSIONS,
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 6612n, cells: 36n },
        timeDelta: 4662n // utime(1766042822) - last_paid(1766038160)
    },

    expected: {
        // Formula: gas = 5290 + 600×cellLoads + (siblingIsFork ? 75 : 0)
        // cellLoads = 4, siblingIsFork = false
        // gas = 5290 + 2400 + 0 = 7690
        gasUsed: 7690n,
        gasFee: 3_076_000n, // 7690 × 400
        actionFee: 0n,
        storageFee: 1751n, // ceil((6612×1 + 36×500) × 4662 / 65536)
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 3_884_551n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
