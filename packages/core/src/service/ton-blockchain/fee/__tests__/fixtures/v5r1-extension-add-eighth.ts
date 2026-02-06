/**
 * V5R1 Add Eighth Extension
 * https://tonviewer.com/transaction/c4fec1044bce37f1969b8fc8fb4c25b52655439230d02d8bf70d6eee384ad729
 *
 * Wallet: UQD3KlCnEgNeGs4blSjo03JGyS4Rn1QiWhO7H6hcxaZwpAH6
 * Extension: 0:0000000000000000000000000000000000000000000000000000000000000004
 * seqno: 9
 * utime: 1765995008
 *
 * Purpose: Test 5.3 - Validate fee estimation for adding extension
 * when there are 7 existing extensions.
 *
 * Patricia trie analysis (7 existing extensions):
 * - 613f... (0110...), 4758... (0100...), 5f70... (0101...) → share prefix "01"
 * - ba6e... (1011...), ffff01-03 (1111...) → bit 0 = '1'
 *
 * New key 0000...04 (0000...) has bit 0 = '0', bit 1 = '0'.
 * Path traversal: root → left subtree (prefix "01")
 * pathDepth=1, subtree has 3 elements (>1)
 *
 * Gas calculation (cellLoads=2):
 * gasUsed = 6610 + 600 × 2 = 7810
 */

import { BLOCKCHAIN_CONFIG_2024_12 } from './blockchain-config';
import { WalletFeeTestCase } from './utils';
import { TonWalletVersion } from '../../compat';

// Existing 7 extensions (in order they were added)
const EXISTING_EXTENSIONS = [
    '613fbe5785a63a981b59e3255f8d94749deadba81d5658d806c6333a1e6a0526', // #1
    'ba6ede4924bdc9ecbd4582c10bfacf1dfdf3e4f1bde5796819e45ff6ea0f8522', // #2
    '4758697a8b9cadbecfe0f102132435465768798a9bacbdcedff0011223344556', // #3
    '5f708192a3b4c5d6e7f8091a2b3c4d5e6f8091a2b3c4d5e6f708192a3b4c5d6e', // #4
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01', // #5
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff02', // #6
    'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03' // #7
];

export const V5R1_EXTENSION_ADD_EIGHTH: WalletFeeTestCase = {
    txHash: 'c4fec1044bce37f1969b8fc8fb4c25b52655439230d02d8bf70d6eee384ad729',

    input: {
        inMsgBoc:
            'te6cckEBAgEAmwABRYgB7lShTiQGvDWcNypR0abkjZJcIz6oRLQndj9QuYtM4UgMAQDlc2lnbn///xFpQvtYAAAACUCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmd3fOQSyMWUSZO4N5SeZsrdUp2AjWLKBkD1H2kJyfIpAVO7JhYFrgxCAq1IJNy8AU5vgo+0Yz5AP+MQaG8UvgZGDSb/I=',
        existingExtensions: EXISTING_EXTENSIONS, // 7 existing extensions
        walletVersion: TonWalletVersion.V5R1,
        storageUsed: { bits: 6349n, cells: 34n },
        timeDelta: 14098n // utime(1765995008) - last_paid(1765980910)
    },

    expected: {
        gasUsed: 7810n, // cellLoads=2: 6610 + 600 × 2 = 7810
        gasFee: 3_124_000n,
        actionFee: 0n, // ZERO because no outMsgs
        storageFee: 5023n,
        importFee: 806_800n,
        fwdFeeRemaining: 0n,
        walletFee: 3_935_823n
    },

    blockchainConfig: BLOCKCHAIN_CONFIG_2024_12
};
