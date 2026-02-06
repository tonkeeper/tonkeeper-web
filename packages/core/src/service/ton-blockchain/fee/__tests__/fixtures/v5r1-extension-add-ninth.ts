/**
 * V5R1 Add Ninth Extension
 * https://tonviewer.com/transaction/6a16454aa6945d25787191caf686bf5df5bd2f9f581771ac1dc9adcc88315331
 *
 * Wallet: UQD3KlCnEgNeGs4blSjo03JGyS4Rn1QiWhO7H6hcxaZwpAH6
 * Extension: 0:0000000000000000000000000000000000000000000000000000000000000005
 * seqno: 10
 * utime: 1766038160
 *
 * Purpose: Test extension addition with 8 existing extensions.
 * Adding 9th extension (00000005) which neighbors 8th (00000004).
 *
 * Patricia trie analysis:
 * - 8 existing extensions with #8 being 00000004 (0000...0100)
 * - New key 00000005 (0000...0101) differs from #8 at bit 254
 * - Path: root → 0 prefix → 00 prefix → deep fork with 00000004
 *
 * Gas calculation (cellLoads=3):
 * gasUsed = 6610 + 600 × 3 = 8410
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// Existing 8 extensions (in order they were added)
const EXISTING_EXTENSIONS = [
    '613fbe5785a63a981b59e3255f8d94749deadba81d5658d806c6333a1e6a0526', // #1
    'ba6ede4924bdc9ecbd4582c10bfacf1dfdf3e4f1bde5796819e45ff6ea0f8522', // #2
    '4758697a8b9cadbecfe0f102132435465768798a9bacbdcedff0011223344556', // #3
    '5f708192a3b4c5d6e7f8091a2b3c4d5e6f8091a2b3c4d5e6f708192a3b4c5d6e', // #4
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01', // #5
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff02', // #6
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03', // #7
    '0000000000000000000000000000000000000000000000000000000000000004' // #8
];

export const V5R1_EXTENSION_ADD_NINTH: WalletFeeTestCase = {
    txHash: '6a16454aa6945d25787191caf686bf5df5bd2f9f581771ac1dc9adcc88315331',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgB7lShTiQGvDWcNypR0abkjZJcIz6oRLQndj9QuYtM4UgMAQDlc2lnbn///xFpQ7IoAAAACkCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAqOFBZ7pjTJNQIOWc/u9QNef9HkzpTWRow+9tis9REdamv1d6G7HLupjHN3bKbz+z5OUbPirI0MZ2KSXbfF2v4HJnWqds=',
        existingExtensions: EXISTING_EXTENSIONS, // 8 existing extensions
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 6614n, cells: 36n },
        timeDelta: 43152n // utime(1766038160) - last_paid(1765995008)
    },

    expected: {
        gasUsed: 8410n, // cellLoads=3: 6610 + 600 × 3 = 8410
        gasFee: 3_364_000n,
        actionFee: 0n, // ZERO because no outMsgs
        storageFee: 16_208n,
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 4_187_008n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
