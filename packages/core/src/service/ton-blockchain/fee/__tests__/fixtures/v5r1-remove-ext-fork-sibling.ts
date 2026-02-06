/**
 * V5R1 Remove Extension - FORK Sibling Case
 * https://tonviewer.com/transaction/dd42b5e585766b58a1e4cb1d24756d1ec4351c1f5a244a44fba1d9a8ba3f2f38
 * in_msg.hash: e169d1236176c803883fe6bd2e5b8e482b51fafa428655fb7a47faafccbccb2b
 *
 * Wallet: UQD3KlCnEgNeGs4blSjo03JGyS4Rn1QiWhO7H6hcxaZwpAH6
 * Extension to remove: 0:613fbe5785a63a981b59e3255f8d94749deadba81d5658d806c6333a1e6a0526 (#1)
 * seqno: 12 (after removing #9 with seqno=11)
 *
 * Purpose: Test remove extension gas calculation with FORK sibling.
 *
 * REMOVE gas formula:
 *   gas = 5290 + 600×cellLoads + (needsEdgeMerge ? 75 : 0)
 *   where needsEdgeMerge = siblingIsFork || rootCollapse(2→1)
 *
 * When removing #1 (613fbe57...) from 8 extensions:
 * - cellLoads = 4 (root → 0-branch → fork → leaf)
 * - sibling = FORK containing #3 and #4 → siblingIsFork = true
 * - needsEdgeMerge = true → +75 gas
 * - gas = 5290 + 2400 + 75 = 7765 ✓
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// Existing 8 extensions after #9 was removed (state after seqno=11)
const EXISTING_EXTENSIONS = [
    '613fbe5785a63a981b59e3255f8d94749deadba81d5658d806c6333a1e6a0526', // #1 - to be removed
    'ba6ede4924bdc9ecbd4582c10bfacf1dfdf3e4f1bde5796819e45ff6ea0f8522', // #2
    '4758697a8b9cadbecfe0f102132435465768798a9bacbdcedff0011223344556', // #3 (sibling branch)
    '5f708192a3b4c5d6e7f8091a2b3c4d5e6f8091a2b3c4d5e6f708192a3b4c5d6e', // #4 (sibling branch)
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01', // #5
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff02', // #6
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03', // #7
    '0000000000000000000000000000000000000000000000000000000000000004' // #8
];

export const V5R1_REMOVE_EXT_FORK_SIBLING: WalletFeeTestCase = {
    txHash: 'e169d1236176c803883fe6bd2e5b8e482b51fafa428655fb7a47faafccbccb2b',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgB7lShTiQGvDWcNypR0abkjZJcIz6oRLQndj9QuYtM4UgMAQDlc2lnbn///xFpQ69pAAAADEDgAwn98rwtMdTA2s8ZKvxso6TvVt1A6rLGwDYxmdDzUCkx+GSZ8tz1JN01ep+1qQ/KzjTqEiT3FmNUMJnOpxT/wcablE4fzDcJLezjzb5BrdZTBYtT0H3OOqLaJiIGzR54TIGfi5Y=',
        existingExtensions: EXISTING_EXTENSIONS,
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 6614n, cells: 36n },
        timeDelta: 511n // utime(1766043333) - last_paid(1766042822)
    },

    expected: {
        // Formula: gas = 5290 + 600×cellLoads + (siblingIsFork ? 75 : 0)
        // With 8 extensions, removing #1:
        // - cellLoads = 4 (root → 0-branch → fork → leaf)
        // - sibling = FORK (contains #3, #4)
        // - gas = 5290 + 600×4 + 75 = 7765 ✓
        gasUsed: 7765n,
        gasFee: 3_106_000n, // 7765 × 400
        actionFee: 0n,
        storageFee: 192n, // ceil((6614×1 + 36×500) × 511 / 65536)
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 3_912_992n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
